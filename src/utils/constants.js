export const POPULATE_ROLE = populate({
  path: "role",
  populate: { path: permissions },
});
