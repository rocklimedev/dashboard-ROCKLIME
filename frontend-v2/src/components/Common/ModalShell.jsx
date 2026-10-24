import { Modal } from 'antd';

/** Shared layout and standard Cancel/OK footer; custom footers remain supported. */
export default function ModalShell({
  confirmLoading = false,
  onCancel,
  onCancelButton,
  onOk,
  okButtonProps,
  cancelButtonProps,
  closable = true,
  maskClosable = true,
  keyboard = true,
  ...props
}) {
  return (
    <Modal
      {...props}
      confirmLoading={confirmLoading}
      onOk={(event) => {
        if (!confirmLoading && !okButtonProps?.disabled) onOk?.(event);
      }}
      onCancel={(event) => {
        if (!confirmLoading) onCancel?.(event);
      }}
      okButtonProps={{ ...okButtonProps, disabled: confirmLoading || okButtonProps?.disabled }}
      cancelButtonProps={{
        ...cancelButtonProps,
        disabled: confirmLoading || cancelButtonProps?.disabled,
        onClick: (event) => {
          if (!confirmLoading && !cancelButtonProps?.disabled) {
            const handler = onCancelButton ?? cancelButtonProps?.onClick ?? onCancel;
            handler?.(event);
          }
        },
      }}
      closable={confirmLoading ? false : closable}
      maskClosable={confirmLoading ? false : maskClosable}
      keyboard={confirmLoading ? false : keyboard}
    />
  );
}
