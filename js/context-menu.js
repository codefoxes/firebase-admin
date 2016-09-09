function create(opts) {
  const editFlags = opts.params.editFlags
  const hasText = opts.params.selectionText.trim().length > 0
  const can = type => editFlags[`can${type}`] && hasText

  let template = [{
    label: 'Cut',
    role: can('Cut') ? 'cut' : '',
    enabled: can('Cut'),
    visible: opts.params.isEditable
  }, {
    label: 'Copy',
    role: can('Copy') ? 'copy' : '',
    enabled: can('Copy'),
    visible: opts.params.isEditable || hasText
  }, {
    label: 'Paste',
    role: editFlags.canPaste ? 'paste' : '',
    enabled: editFlags.canPaste,
    visible: opts.params.isEditable
  }]
  return template
}

exports = module.exports = (opts = {}) => {
  return create(opts)
}
