-- Generic RPC: atomically update a header row + upsert/delete item rows in a single transaction.
-- On any failure, the entire operation rolls back (no partial updates).
CREATE OR REPLACE FUNCTION public.atomic_update_with_items(
  p_header_table TEXT,
  p_items_table TEXT,
  p_header_fk TEXT,
  p_header_id UUID,
  p_organization_id UUID,
  p_header_data JSONB,
  p_items_upsert JSONB,
  p_items_delete UUID[],
  p_header_return_select TEXT DEFAULT '*',
  p_items_return_select TEXT DEFAULT '*',
  p_auto_line_number BOOLEAN DEFAULT FALSE,
  p_soft_delete_items BOOLEAN DEFAULT TRUE,
  p_soft_delete_header BOOLEAN DEFAULT TRUE,
  p_auto_sum_field TEXT DEFAULT NULL,
  p_auto_sum_expr TEXT DEFAULT 'COALESCE(amount, quantity * unit_price, 0)'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_header_row JSONB;
  v_items_rows JSONB;
  v_item JSONB;
  v_item_id UUID;
  v_idx INT := 0;
  v_sql TEXT;
  v_cols TEXT;
  v_keys TEXT[];
  v_sanitized JSONB;
  v_total NUMERIC := 0;
BEGIN
  -- Validate table/column names (prevent SQL injection)
  IF p_header_table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid header table name: %', p_header_table;
  END IF;
  IF p_items_table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid items table name: %', p_items_table;
  END IF;
  IF p_header_fk !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid FK column name: %', p_header_fk;
  END IF;
  IF p_header_return_select !~ '^[a-z0-9_, .*()]+$' THEN
    RAISE EXCEPTION 'Invalid header return select: %', p_header_return_select;
  END IF;
  IF p_items_return_select !~ '^[a-z0-9_, .*()]+$' THEN
    RAISE EXCEPTION 'Invalid items return select: %', p_items_return_select;
  END IF;
  IF p_auto_sum_expr !~ '^[a-z0-9_, *()+\-/COALESCE]+$' THEN
    RAISE EXCEPTION 'Invalid auto sum expression: %', p_auto_sum_expr;
  END IF;

  -- 1. Delete items (soft or hard)
  IF array_length(p_items_delete, 1) > 0 THEN
    IF p_soft_delete_items THEN
      v_sql := format(
        'UPDATE %I SET deleted_at = now() WHERE id = ANY($1) AND %I = $2',
        p_items_table, p_header_fk
      );
    ELSE
      v_sql := format(
        'DELETE FROM %I WHERE id = ANY($1) AND %I = $2',
        p_items_table, p_header_fk
      );
    END IF;
    EXECUTE v_sql USING p_items_delete, p_header_id;
  END IF;

  -- 2. Upsert items
  IF jsonb_array_length(p_items_upsert) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_upsert)
    LOOP
      v_idx := v_idx + 1;
      v_item_id := (v_item ->> 'id')::UUID;

      -- Remove blocked fields
      v_sanitized := v_item - 'id' - 'organization_id' - 'deleted_at' - 'created_at' - 'created_by' - p_header_fk;

      IF p_auto_line_number AND NOT v_sanitized ? 'line_number' THEN
        v_sanitized := v_sanitized || jsonb_build_object('line_number', v_idx);
      END IF;

      IF v_item_id IS NOT NULL THEN
        -- Update existing item
        SELECT array_agg(k) INTO v_keys FROM jsonb_object_keys(v_sanitized) AS k;
        IF v_keys IS NOT NULL AND array_length(v_keys, 1) > 0 THEN
          v_sql := format(
            'UPDATE %I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::%I, $1)) WHERE id = $2 AND %I = $3',
            p_items_table,
            (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u),
            (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u),
            p_items_table,
            p_header_fk
          );
          IF p_soft_delete_items THEN
            v_sql := v_sql || ' AND deleted_at IS NULL';
          END IF;
          EXECUTE v_sql USING v_sanitized, v_item_id, p_header_id;
        END IF;
      ELSE
        -- Insert new item
        v_sanitized := v_sanitized || jsonb_build_object(p_header_fk, p_header_id);
        SELECT array_agg(k) INTO v_keys FROM jsonb_object_keys(v_sanitized) AS k;
        v_cols := (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u);
        v_sql := format(
          'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1)',
          p_items_table, v_cols, v_cols, p_items_table
        );
        EXECUTE v_sql USING v_sanitized;
      END IF;
    END LOOP;
  END IF;

  -- 3. Auto-sum if configured
  IF p_auto_sum_field IS NOT NULL AND p_auto_sum_field ~ '^[a-z_][a-z0-9_]*$' THEN
    v_sql := format(
      'SELECT COALESCE(SUM((%s)::numeric), 0) FROM %I WHERE %I = $1',
      p_auto_sum_expr, p_items_table, p_header_fk
    );
    IF p_soft_delete_items THEN
      v_sql := v_sql || ' AND deleted_at IS NULL';
    END IF;
    EXECUTE v_sql INTO v_total USING p_header_id;

    -- Merge sum into header data
    p_header_data := COALESCE(p_header_data, '{}'::jsonb) || jsonb_build_object(p_auto_sum_field, round(v_total, 2));
  END IF;

  -- 4. Update header
  IF p_header_data IS NOT NULL AND p_header_data != '{}'::jsonb THEN
    SELECT array_agg(k) INTO v_keys FROM jsonb_object_keys(p_header_data) AS k;
    IF v_keys IS NOT NULL AND array_length(v_keys, 1) > 0 THEN
      v_cols := (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u);
      v_sql := format(
        'UPDATE %I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::%I, $1)) WHERE id = $2 AND organization_id = $3',
        p_header_table, v_cols, v_cols, p_header_table
      );
      IF p_soft_delete_header THEN
        v_sql := v_sql || ' AND deleted_at IS NULL';
      END IF;
      EXECUTE v_sql USING p_header_data, p_header_id, p_organization_id;
    END IF;
  END IF;

  -- 5. Fetch updated header
  v_sql := format('SELECT to_jsonb(t) FROM (SELECT %s FROM %I WHERE id = $1 AND organization_id = $2) t', p_header_return_select, p_header_table);
  EXECUTE v_sql INTO v_header_row USING p_header_id, p_organization_id;

  -- 6. Fetch updated items
  v_sql := format('SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM (SELECT %s FROM %I WHERE %I = $1', p_items_return_select, p_items_table, p_header_fk);
  IF p_soft_delete_items THEN
    v_sql := v_sql || ' AND deleted_at IS NULL';
  END IF;
  v_sql := v_sql || ' ORDER BY line_number, created_at) t';
  EXECUTE v_sql INTO v_items_rows USING p_header_id;

  RETURN jsonb_build_object('header', v_header_row, 'items', COALESCE(v_items_rows, '[]'::jsonb));
END;
$$;
