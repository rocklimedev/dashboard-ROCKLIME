Shared modals
=============

Use `ModalShell` for declarative dialogs. It provides Ant Design's header, body,
and standard Cancel/OK footer, and forwards modal props such as `width`, `title`,
`afterClose`, and `destroyOnClose`.

For forms, keep validation and save logic in the form's `onFinish` handler. The
shared footer submits the existing form instance:

```jsx
<ModalShell
  open={open}
  title="Edit record"
  onCancel={onClose}
  onOk={() => form.submit()}
  okText="Save changes"
  confirmLoading={isSaving}
>
  <Form form={form} onFinish={saveRecord}>
    {/* Fields */}
  </Form>
</ModalShell>
```

`confirmLoading` disables both standard footer actions and prevents dismissal by
the close button, backdrop, or Escape. `okButtonProps` and `cancelButtonProps`
preserve additional disabled conditions. Use `onCancelButton` only when the
footer cancel action needs different cleanup from the close button. Read-only
dialogs can use `footer={null}`; dialogs with specialized actions such as PDF and
Excel export can supply their own `footer`.

Use `DeleteModal` for deletion. Existing single-record callers retain their
`item`, `itemType`, `isVisible`, `isLoading`, `onConfirm`, and `onCancel` props.
Bulk product deletion passes `products` and `isVisible`; its confirmation callback
receives that array. Single-record confirmation receives `item`.

`itemType="Product"` and bulk `products` enable reference checks. Confirmation is
blocked until the current selection passes those checks. Failed checks expose a
retry action. `ProductDeletionPreview` renders the reference report; it does not
create another modal. A changed selection, retry, or reopened dialog invalidates
the previous report. The deletion API still performs its final reference check.

Run `npm run test:modals` for the shared shell and delete-confirmation tests.
