-- Generic RPC: atomically insert a header row + item rows in a single transaction.
-- On any failure, the entire operation rolls back (no orphaned records).
CREATE OR REPLACE FUNCTION public.atomic_create_with_items(
  p_header_table TEXT,
  p_items_table TEXT,
  p_header_fk TEXT,
  p_header_data JSONB,
  p_items_data JSONB,
  p_header_return_select TEXT DEFAULT '*',
  p_items_return_select TEXT DEFAULT '*',
  p_auto_line_number BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_header_id UUID;
  v_header_row JSONB;
  v_items_rows JSONB;
  v_item JSONB;
  v_item_with_fk JSONB;
  v_idx INT := 0;
  v_sql TEXT;
  v_cols TEXT;
  v_key TEXT;
  v_keys TEXT[];
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
  IF p_header_return_select !~ '^[a-z0-9_, *]+$' THEN
    RAISE EXCEPTION 'Invalid header return select: %', p_header_return_select;
  END IF;
  IF p_items_return_select !~ '^[a-z0-9_, *]+$' THEN
    RAISE EXCEPTION 'Invalid items return select: %', p_items_return_select;
  END IF;

  -- Insert header: only insert provided columns so DB defaults (id, timestamps) apply
  SELECT array_agg(k) INTO v_keys FROM jsonb_object_keys(p_header_data) AS k;
  v_cols := (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u);
  v_sql := format(
    'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1) RETURNING id',
    p_header_table, v_cols, v_cols, p_header_table
  );
  EXECUTE v_sql INTO v_header_id USING p_header_data;

  -- Fetch header with requested columns
  v_sql := format('SELECT to_jsonb(t) FROM (SELECT %s FROM %I WHERE id = $1) t', p_header_return_select, p_header_table);
  EXECUTE v_sql INTO v_header_row USING v_header_id;

  -- Insert items
  v_items_rows := '[]'::JSONB;
  IF jsonb_array_length(p_items_data) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
      v_idx := v_idx + 1;
      v_item_with_fk := v_item || jsonb_build_object(p_header_fk, v_header_id);
      IF p_auto_line_number AND NOT v_item_with_fk ? 'line_number' THEN
        v_item_with_fk := v_item_with_fk || jsonb_build_object('line_number', v_idx);
      END IF;

      SELECT array_agg(ik) INTO v_keys FROM jsonb_object_keys(v_item_with_fk) AS ik;
      v_cols := (SELECT string_agg(quote_ident(u), ', ') FROM unnest(v_keys) AS u);
      v_sql := format(
        'INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1) RETURNING to_jsonb(%I.*)',
        p_items_table, v_cols, v_cols, p_items_table, p_items_table
      );

      DECLARE
        v_inserted JSONB;
      BEGIN
        EXECUTE v_sql INTO v_inserted USING v_item_with_fk;
        v_items_rows := v_items_rows || jsonb_build_array(v_inserted);
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('header', v_header_row, 'items', v_items_rows);
END;
$$;
