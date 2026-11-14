# Explorer refresh acceptance
- Refresh button collapses all expanded directories, including nested descendants.
- Clears persisted expanded flags and current selection.
- Does not remove root handles, files, editor tabs or unsaved changes.
- On page reload, the tree remains collapsed until the active editor's explicit reveal action.
- Browser integration tests remain pending; existing GitHub test workflow is failing independently.
