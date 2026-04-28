import { useTranslate } from '@refinedev/core';
import { Card, Typography, Row, Col } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  AccountBookOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const modules = [
  { icon: <ShoppingCartOutlined style={{ fontSize: 28 }} />, key: 'procurement' },
  { icon: <DollarOutlined style={{ fontSize: 28 }} />, key: 'sales' },
  { icon: <InboxOutlined style={{ fontSize: 28 }} />, key: 'inventory' },
  { icon: <ToolOutlined style={{ fontSize: 28 }} />, key: 'manufacturing' },
  { icon: <SafetyCertificateOutlined style={{ fontSize: 28 }} />, key: 'quality' },
  { icon: <AccountBookOutlined style={{ fontSize: 28 }} />, key: 'finance' },
];

export const WelcomePage: React.FC = () => {
  const t = useTranslate();

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('dashboard.welcome', 'Welcome to ERP Refine')}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('dashboard.selectModule', 'Select a module from the left menu to get started.')}
      </Text>
      <Row gutter={[16, 16]}>
        {modules.map((m) => (
          <Col key={m.key} xs={12} sm={8} md={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              {m.icon}
              <div style={{ marginTop: 8 }}>
                <Text>{t(`${m.key}.${m.key}`, m.key)}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
