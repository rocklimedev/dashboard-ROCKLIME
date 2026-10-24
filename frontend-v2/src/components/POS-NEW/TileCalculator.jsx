import './TileCalculator.styles.css';
// Area → boxes. Uses the product's "Coverage per box" (sq ft) when it is set;
// otherwise the coverage can be typed in. Adds a wastage allowance (default
// 10%) and rounds up to whole boxes, then sets the cart quantity.
import React, { useState } from 'react';
import { Button, InputNumber, Popover, Space, Typography, Segmented } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

import { coverageFromProduct, boxesFor } from './tileMath';

const { Text } = Typography;
const SQM_TO_SQFT = 10.7639;

export default function TileCalculator({ product, onApply, disabled }) {
  const saved = coverageFromProduct(product);
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState('sq ft');
  const [area, setArea] = useState(null);
  const [coverage, setCoverage] = useState(saved);
  const [wastage, setWastage] = useState(10);

  const areaSqft = unit === 'sq m' ? (Number(area) || 0) * SQM_TO_SQFT : Number(area) || 0;
  const cov = saved || coverage;
  const boxes = boxesFor(areaSqft, cov, wastage);

  const content = (
    <Space className="fv2-tilecalculator-5ca1f22c5b" direction="vertical" size={8}>
      <Segmented size="small" options={['sq ft', 'sq m']} value={unit} onChange={setUnit} />
      <Space>
        <Text className="fv2-tilecalculator-2ab2384501">Area</Text>
        <InputNumber
          className="fv2-tilecalculator-9bebaa9c43"
          min={0}
          value={area}
          onChange={setArea}
          addonAfter={unit}

          autoFocus
        />
      </Space>
      <Space>
        <Text className="fv2-tilecalculator-2ab2384501">Per box</Text>
        {saved ? (
          <Text>{saved} sq ft</Text>
        ) : (
          <InputNumber
            className="fv2-tilecalculator-9bebaa9c43"
            min={0}
            value={coverage}
            onChange={setCoverage}
            addonAfter="sq ft"

            placeholder="not set"
          />
        )}
      </Space>
      <Space>
        <Text className="fv2-tilecalculator-2ab2384501">Wastage</Text>
        <InputNumber
          className="fv2-tilecalculator-9bebaa9c43"
          min={0}
          max={50}
          value={wastage}
          onChange={setWastage}
          addonAfter="%"
        />
      </Space>
      <Text className="fv2-tilecalculator-65ee9476fb" type="secondary">
        {boxes
          ? `${boxes} box${boxes > 1 ? 'es' : ''} covers ${Math.round(boxes * cov)} sq ft`
          : cov
            ? 'Enter the area'
            : "Coverage per box isn't set for this product; type it in, or add it under the product's details."}
      </Text>
      <Button
        type="primary"
        size="small"
        block
        disabled={!boxes}
        onClick={() => {
          onApply?.(boxes);
          setOpen(false);
        }}
      >
        Set quantity to {boxes || '—'}
      </Button>
    </Space>
  );

  return (
    <Popover
      content={content}
      title="Tile calculator"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Button
        size="small"
        icon={<CalculatorOutlined />}
        disabled={disabled}
        title="Work out boxes from area"
      />
    </Popover>
  );
}
