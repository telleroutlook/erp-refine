import type { CrudFilter } from '@refinedev/core';

export const SOFT_DELETE_FILTER: { permanent: CrudFilter[] } = {
  permanent: [{ field: 'deleted_at', operator: 'null', value: true }],
};
