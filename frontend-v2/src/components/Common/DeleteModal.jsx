import { DeleteOutlined } from '@ant-design/icons';
import ModalShell from './ModalShell';
import ProductDeletionPreview from '../Inventory/ProductDeletionPreview';
import useProductDeletionPreview from '../Inventory/useProductDeletionPreview';

/** Shared confirmation for records and checked single/bulk product deletion. */
export default function DeleteModal({
  item,
  itemType,
  products,
  onConfirm,
  onCancel,
  isVisible,
  isLoading = false,
}) {
  const isProduct = itemType === 'Product' || products !== undefined;
  const targets = products ?? (item ? [item] : []);
  const open = !!isVisible && (!isProduct || targets.length > 0);
  const { report, failure, retry } = useProductDeletionPreview(targets, open && isProduct);
  const blocked = isProduct && (!report?.canDelete || !!failure);
  const title = isProduct
    ? `Delete ${targets.length === 1 ? targets[0].name : `${targets.length} selected products`}?`
    : `Delete ${itemType}`;

  return (
    <ModalShell
      open={open}
      title={
        <>
          <DeleteOutlined /> {title}
        </>
      }
      centered
      width={isProduct ? 850 : undefined}
      onCancel={onCancel}
      onOk={() => {
        if (!blocked) onConfirm(products ?? item);
      }}
      confirmLoading={isLoading}
      okText={isProduct ? 'Delete permanently' : 'Yes, Delete'}
      okButtonProps={{ danger: true, disabled: blocked }}
      maskClosable={false}
      keyboard={false}
    >
      {isProduct ? (
        <ProductDeletionPreview
          products={targets}
          report={report}
          failure={failure}
          onRetry={retry}
          isLoading={isLoading}
        />
      ) : (
        <p>Are you sure you want to delete {itemType}?</p>
      )}
    </ModalShell>
  );
}
