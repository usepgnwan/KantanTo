import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Card, Table, Button, Tag, Typography, Space, Modal,
  Form, Input, InputNumber, Dropdown, message, Avatar,
  Col, Row, Select, Upload, Spin,
} from 'antd';
import type { TableColumnsType, MenuProps } from 'antd';
import {
  PlusOutlined, SettingOutlined, DeleteOutlined, MoreOutlined,
  TagsOutlined, EditOutlined, ClockCircleOutlined,
  PictureOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  PackageListItem,
} from '../../services/packageService';
import { getGrades, Grade } from '../../services/gradeService';
import { getMapels, Mapel } from '../../services/mapelService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Local UI shape — wraps the API item with a stable `key`
interface PackageRow extends PackageListItem {
  key: string;
}

const toRow = (pkg: PackageListItem): PackageRow => ({
  ...pkg,
  key: pkg.slug,
  classes: Array.isArray(pkg.classes) ? pkg.classes : [],
  subjects: Array.isArray(pkg.subjects) ? pkg.subjects : [],
  questions_count: Number(pkg.questions_count) || 0,
  materials_count: Number(pkg.materials_count) || 0,
  videos_count: Number(pkg.videos_count) || 0,
});

export const getPackageEffectivePrice = (p: PackageListItem | PackageRow): number => {
  if (p.is_bundle) {
    return p.price || 0;
  }
  if (p.discount_type === 'percent') {
    return Math.max(0, (p.price || 0) - ((p.price || 0) * (p.discount_value || 0)) / 100);
  }
  if (p.discount_type === 'harga') {
    return Math.max(0, (p.price || 0) - (p.discount_value || 0));
  }
  return p.price || 0;
};

const AdminPackageForm: React.FC = () => {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [mapels, setMapels] = useState<Mapel[]>([]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPackages();
      setPackages(data.map(toRow));
    } catch (err: any) {
      message.error('Gagal memuat daftar paket');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  // Fetch grades and mapels for dropdowns
  useEffect(() => {
    getGrades(1, 100).then(res => setGrades(res.rows)).catch(() => {});
    getMapels(1, 100).then(res => setMapels(res.rows)).catch(() => {});
  }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'published',
      classes: [],
      subjects: [],
      duration: 120,
      price: 0,
      is_lifetime: true,
      validity_days: 30,
      max_exam_attempts: 0,
      is_bundle: false,
      bundled_package_ids: [],
      original_price: 0,
      bundle_discount_type: 'fixed',
      bundle_discount_value: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (pkg: PackageRow) => {
    setEditTarget(pkg);
    form.setFieldsValue({
      title: pkg.title,
      description: pkg.description,
      category: pkg.category,
      status: pkg.status,
      classes: pkg.classes,
      subjects: pkg.subjects,
      duration: pkg.duration,
      price: pkg.price,
      discount_type: pkg.discount_type || '',
      discount_value: pkg.discount_value || 0,
      is_lifetime: pkg.is_lifetime,
      validity_days: pkg.validity_days || 30,
      max_exam_attempts: pkg.max_exam_attempts || 0,
      is_bundle: Boolean(pkg.is_bundle),
      bundled_package_ids: pkg.bundled_package_ids || [],
      original_price: pkg.original_price || 0,
      bundle_discount_type: (pkg.bundle_discount_type as any) || 'fixed',
      bundle_discount_value: pkg.bundle_discount_value || 0,
    });
    setModalOpen(true);
  };

  // Helper calculate bundle price
  const recalculateBundlePrice = () => {
    const isBundle = form.getFieldValue('is_bundle');
    if (!isBundle) return;
    const selectedIds: number[] = form.getFieldValue('bundled_package_ids') || [];
    const selectedPkgs = packages.filter(p => selectedIds.includes(p.id));
    const origPrice = selectedPkgs.reduce((acc, p) => acc + getPackageEffectivePrice(p), 0);
    form.setFieldValue('original_price', origPrice);

    const discType = form.getFieldValue('bundle_discount_type') || 'fixed';
    const discVal = Number(form.getFieldValue('bundle_discount_value') || 0);

    let finalPrice = origPrice;
    if (discType === 'percent' || discType === 'percentage') {
      finalPrice = origPrice - (origPrice * discVal) / 100;
    } else {
      finalPrice = Math.max(0, origPrice - discVal);
    }
    form.setFieldValue('price', finalPrice);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const vals = await form.validateFields();
    setSubmitting(true);
    try {
      const isBundle = Boolean(vals.is_bundle);
      const payload = {
        title: vals.title,
        description: vals.description,
        price: vals.price ?? 0,
        category: vals.category ?? '',
        classes: vals.classes ?? [],
        subjects: vals.subjects ?? [],
        duration: isBundle ? 0 : (vals.duration ?? 0),
        status: vals.status ?? 'draft',
        thumbnail: editTarget?.thumbnail || '',
        discount_type: isBundle ? '' : (vals.discount_type ?? ''),
        discount_value: isBundle ? 0 : (vals.discount_value ?? 0),
        is_lifetime: isBundle ? true : (vals.is_lifetime ?? true),
        validity_days: isBundle ? 0 : (vals.validity_days ?? 0),
        max_exam_attempts: isBundle ? 0 : (vals.max_exam_attempts ?? 0),
        is_bundle: isBundle,
        bundled_package_ids: isBundle ? (vals.bundled_package_ids ?? []) : [],
        original_price: isBundle ? (vals.original_price ?? 0) : 0,
        bundle_discount_type: isBundle ? (vals.bundle_discount_type ?? '') : '',
        bundle_discount_value: isBundle ? (vals.bundle_discount_value ?? 0) : 0,
      };

      if (editTarget) {
        const updated = await updatePackage(editTarget.slug, {
          slug: editTarget.slug,
          ...payload,
        });
        setPackages(prev =>
          prev.map(p => p.slug === editTarget.slug ? toRow(updated) : p)
        );
        message.success('Paket berhasil diperbarui');
      } else {
        const slugBase = vals.title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const candidateSlug = slugBase || 'paket';
        const slug = packages.some(pkg => pkg.slug === candidateSlug)
          ? `${candidateSlug}-${Date.now()}`
          : candidateSlug;
        const created = await createPackage({
          slug,
          ...payload,
        });
        setPackages(prev => [...prev, toRow(created)]);
        message.success('Paket baru berhasil dibuat');
      }
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Row actions ───────────────────────────────────────────────────────────
  const handleStatusChange = async (pkg: PackageRow, newStatus: PackageListItem['status']) => {
    try {
      const updated = await updatePackage(pkg.slug, {
        slug: pkg.slug,
        title: pkg.title,
        description: pkg.description,
        price: pkg.price,
        category: pkg.category,
        classes: pkg.classes,
        subjects: pkg.subjects,
        duration: pkg.duration,
        status: newStatus,
        thumbnail: pkg.thumbnail,
        discount_type: pkg.discount_type,
        discount_value: pkg.discount_value,
        is_lifetime: pkg.is_lifetime,
        validity_days: pkg.validity_days,
        max_exam_attempts: pkg.max_exam_attempts,
        is_bundle: pkg.is_bundle,
        bundled_package_ids: pkg.bundled_package_ids,
        original_price: pkg.original_price,
        bundle_discount_type: pkg.bundle_discount_type,
        bundle_discount_value: pkg.bundle_discount_value,
      });
      setPackages(prev => prev.map(p => p.slug === pkg.slug ? toRow(updated) : p));
    } catch {
      message.error('Gagal mengubah status');
    }
  };

  const handlePermanentDelete = async (pkg: PackageRow) => {
    try {
      await deletePackage(pkg.slug);
      setPackages(prev => prev.filter(p => p.slug !== pkg.slug));
      message.error('Paket dihapus selamanya');
    } catch {
      message.error('Gagal menghapus paket');
    }
  };

  const rowActions = (pkg: PackageRow): MenuProps['items'] => [
    {
      key: 'edit',
      label: <span className="font-bold">Edit Informasi</span>,
      icon: <EditOutlined />,
      onClick: () => openEdit(pkg),
    },
    {
      key: 'manage',
      label: <span className="font-bold">Kelola Soal & Materi</span>,
      icon: <SettingOutlined />,
      onClick: () => navigate(`/admin/packages/${pkg.slug}`),
    },
    { type: 'divider' },
    {
      key: 'publish',
      label: 'Set Published',
      disabled: pkg.status === 'published',
      onClick: () => handleStatusChange(pkg, 'published'),
    },
    {
      key: 'draft',
      label: 'Set Draft',
      disabled: pkg.status === 'draft',
      onClick: () => handleStatusChange(pkg, 'draft'),
    },
    {
      key: 'delete-soft',
      label: 'Set Deleted',
      disabled: pkg.status === 'deleted',
      onClick: () => handleStatusChange(pkg, 'deleted'),
    },
    { type: 'divider' },
    {
      key: 'delete-permanent',
      label: <span className="text-red-500 font-bold">Hapus Selamanya</span>,
      icon: <DeleteOutlined className="text-red-500" />,
      onClick: () => {
        Modal.confirm({
          title: 'Hapus Paket Selamanya?',
          content: `Paket "${pkg.title}" dan seluruh soal/materinya akan dihapus permanen.`,
          okText: 'Hapus',
          okButtonProps: { danger: true },
          onOk: () => handlePermanentDelete(pkg),
        });
      },
    },
  ];

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: TableColumnsType<PackageRow> = [
    {
      title: 'Paket',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div className="flex items-start gap-3">
          <Avatar
            size={40}
            className={`${record.is_bundle ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'} shrink-0 text-lg font-black rounded-xl`}
            shape="square"
          >
            {record.is_bundle ? '🎁' : (title?.[0] ?? '?')}
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-on-surface dark:text-zinc-100">{title}</span>
              {record.is_bundle && (
                <Tag color="purple" className="!text-[10px] !m-0 font-bold rounded-md px-1.5 py-0">
                  🎁 Bundle ({record.bundled_package_ids?.length || 0} Paket)
                </Tag>
              )}
            </div>
            <Text className="text-xs text-on-surface/40 dark:text-zinc-500 line-clamp-1">{record.description}</Text>
            {record.is_bundle && record.bundled_packages && record.bundled_packages.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <span className="text-[10px] text-purple-600 font-bold">Termasuk:</span>
                {record.bundled_packages.map(sp => (
                  <Tag key={sp.id} className="!text-[9px] !m-0 bg-purple-50 text-purple-700 border-purple-200 rounded-md px-1.5">
                    {sp.title}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Atribut (Kat/Kls/Mapel)',
      key: 'attributes',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          {record.category && (
            <Tag className="rounded-lg bg-primary/10 text-primary border-none font-bold text-[9px] px-2 w-fit">
              {record.category}
            </Tag>
          )}
          <Space size={2} wrap>
            {record.classes.map(c => (
              <Tag key={c} className="rounded-lg bg-on-surface/5 text-on-surface/40 border-none font-bold text-[9px] px-2 m-0">{c}</Tag>
            ))}
          </Space>
          <Space size={2} wrap>
            {record.subjects.map(s => (
              <Tag key={s} className="rounded-lg bg-blue-500/10 text-blue-500 border-none font-bold text-[9px] px-2 m-0">{s}</Tag>
            ))}
          </Space>
        </div>
      ),
    },
    {
      title: 'Durasi',
      dataIndex: 'duration',
      key: 'duration',
      render: (dur, record) => (
        record.is_bundle ? (
          <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">
            Ikut Sub-Paket
          </Tag>
        ) : (
          <Space className="text-on-surface/60 dark:text-zinc-400">
            <ClockCircleOutlined />
            <span className="text-xs font-bold">{dur} Menit</span>
          </Space>
        )
      ),
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price, record) => {
        if (record.is_bundle && record.original_price && record.original_price > record.price) {
          const discountVal = record.original_price - record.price;
          const discountPct = Math.round((discountVal / record.original_price) * 100);
          return (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-on-surface/40 line-through">
                Rp {Number(record.original_price).toLocaleString('id-ID')}
              </span>
              <span className="font-black text-purple-600 text-sm">
                Rp {Number(price).toLocaleString('id-ID')}
              </span>
              <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                Hemat Rp {discountVal.toLocaleString('id-ID')} ({discountPct}%)
              </Tag>
            </div>
          );
        }

        return (
          <div className="flex flex-col items-end gap-1">
            {record.discount_type ? (
              <>
                <span className="text-xs text-on-surface/40 line-through">
                  Rp {Number(price).toLocaleString('id-ID')}
                </span>
                <span className="font-black text-primary">
                  Rp {Number(
                    record.discount_type === 'percent'
                      ? price - (price * (record.discount_value || 0)) / 100
                      : price - (record.discount_value || 0)
                  ).toLocaleString('id-ID')}
                </span>
                <Tag color="red" className="m-0 mt-1 border-none font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                  {record.discount_type === 'percent' ? `${record.discount_value}% OFF` : `Hemat Rp ${Number(record.discount_value).toLocaleString('id-ID')}`}
                </Tag>
              </>
            ) : (
              <span className="font-black text-primary">
                {price === 0 ? 'Gratis' : `Rp ${Number(price).toLocaleString('id-ID')}`}
              </span>
            )}
          </div>
        );
      },
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Konten',
      key: 'content',
      render: (_, r) => (
        <Space size={4} wrap>
          <Tag className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold text-[10px] px-2">
            {r.questions_count} soal
          </Tag>
          <Tag className="rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-none font-bold text-[10px] px-2">
            {r.materials_count} materi
          </Tag>
          <Tag className="rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-none font-bold text-[10px] px-2">
            {r.videos_count} video
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Akses & Limit',
      key: 'access_limit',
      render: (_, r) => (
        r.is_bundle ? (
          <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">
            Sesuai Sub-Paket
          </Tag>
        ) : (
          <Space direction="vertical" size={2}>
            {r.is_lifetime ? (
              <Tag color="green" className="m-0 rounded-lg border-none font-bold text-[9px] px-2">Lifetime</Tag>
            ) : (
              <Tag color="blue" className="m-0 rounded-lg border-none font-bold text-[9px] px-2">{r.validity_days} Hari</Tag>
            )}
            {r.max_exam_attempts === 0 ? (
              <Tag color="orange" className="m-0 rounded-lg border-none font-bold text-[9px] px-2">Ujian Unlimited</Tag>
            ) : (
              <Tag color="magenta" className="m-0 rounded-lg border-none font-bold text-[9px] px-2">Max {r.max_exam_attempts}x Ujian</Tag>
            )}
          </Space>
        )
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'orange';
        let label = 'Draft';
        if (status === 'published') { color = 'green'; label = 'Published'; }
        if (status === 'deleted') { color = 'red'; label = 'Deleted'; }
        return <Tag color={color} className="rounded-full font-bold px-3">{label}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            size="small"
            className="rounded-xl font-bold h-8 px-3"
            onClick={() => navigate(`/admin/packages/${record.slug}`)}
          >
            Kelola
          </Button>
          <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} className="text-on-surface/40 hover:text-primary dark:text-zinc-500" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Manajemen Konten</Text>
              <Title level={1} className="!text-3xl !font-manrope !font-black !m-0 dark:text-zinc-100">Daftar Paket</Title>
              <Text className="text-on-surface/50 dark:text-zinc-400 text-sm">Kelola katalog paket satuan, paket bundle kombo, durasi, dan akses siswa</Text>
            </div>
            <Space className="mt-4 sm:mt-0">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchPackages}
                loading={loading}
                className="h-11 rounded-2xl font-bold"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={openCreate}
                className="h-11 rounded-2xl font-bold shadow-lg shadow-primary/20"
              >
                Tambah Paket
              </Button>
            </Space>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Paket', value: packages.length, color: 'text-primary' },
              { label: 'Paket Bundle', value: packages.filter(p => p.is_bundle).length, color: 'text-purple-600' },
              { label: 'Published', value: packages.filter(p => p.status === 'published').length, color: 'text-green-500' },
              { label: 'Draft / Inactive', value: packages.filter(p => p.status === 'draft').length, color: 'text-orange-500' },
            ].map((s) => (
              <Card key={s.label} className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-sm text-center py-2">
                <div className={`text-2xl font-black font-manrope ${s.color}`}>{s.value}</div>
                <Text className="text-[10px] uppercase font-black text-on-surface/40 dark:text-zinc-500 tracking-wider font-manrope">{s.label}</Text>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md p-0 overflow-hidden">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={packages}
                pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} paket` }}
                scroll={{ x: 800 }}
                className="weightless-table"
                locale={{ emptyText: 'Belum ada paket. Klik "Tambah Paket" untuk memulai.' }}
              />
            </Spin>
          </Card>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        title={
          <div className="flex items-center gap-2 font-manrope font-black text-lg py-2">
            <TagsOutlined className="text-primary" />
            <span>{editTarget ? 'Edit Informasi Paket' : 'Tambah Paket Baru'}</span>
          </div>
        }
        okText={editTarget ? 'Simpan Perubahan' : 'Buat Paket'}
        cancelText="Batal"
        okButtonProps={{ className: 'rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20' }}
        cancelButtonProps={{ className: 'rounded-xl h-11 px-6 font-bold' }}
        width={620}
        centered
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-4" onValuesChange={() => recalculateBundlePrice()}>
          <Row gutter={16}>
            {/* Toggle Bundle */}
            <Col span={24}>
              <Form.Item name="is_bundle" label={<span className="font-bold text-sm">Tipe Paket</span>} initialValue={false}>
                <Select
                  className="rounded-xl w-full"
                  style={{ height: 44 }}
                  onChange={() => recalculateBundlePrice()}
                  options={[
                    { value: false, label: '📦 Paket Satuan (Single Package)' },
                    { value: true, label: '🎁 Paket Bundle (Kombo Beberapa Paket)' },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Bundle Configuration Section */}
            <Col span={24}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_bundle !== curr.is_bundle || prev.bundled_package_ids !== curr.bundled_package_ids || prev.bundle_discount_type !== curr.bundle_discount_type || prev.bundle_discount_value !== curr.bundle_discount_value}>
                {({ getFieldValue }) => {
                  const isBundle = getFieldValue('is_bundle');
                  if (!isBundle) return null;

                  const selectedIds: number[] = getFieldValue('bundled_package_ids') || [];
                  const selectedPkgs = packages.filter(p => selectedIds.includes(p.id));
                  const origPrice = selectedPkgs.reduce((acc, p) => acc + getPackageEffectivePrice(p), 0);
                  const discType = getFieldValue('bundle_discount_type') || 'fixed';
                  const discVal = Number(getFieldValue('bundle_discount_value') || 0);

                  let finalPrice = origPrice;
                  if (discType === 'percent' || discType === 'percentage') {
                    finalPrice = origPrice - (origPrice * discVal) / 100;
                  } else {
                    finalPrice = Math.max(0, origPrice - discVal);
                  }
                  const hemat = origPrice - finalPrice;

                  return (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 mb-4 space-y-4">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                        <span>🎁 Pengaturan Paket Bundle</span>
                      </div>

                      <Form.Item
                        name="bundled_package_ids"
                        label={<span className="font-bold text-xs text-purple-950">Pilih Paket yang Digabungkan dalam Bundle</span>}
                        rules={[{ required: isBundle, message: 'Pilih minimal 1 paket untuk bundle' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Pilih paket-paket..."
                          className="rounded-xl w-full"
                          style={{ height: 'auto', minHeight: 44 }}
                          onChange={() => recalculateBundlePrice()}
                          options={packages
                            .filter(p => !p.is_bundle && (!editTarget || p.slug !== editTarget.slug))
                            .map(p => {
                              const eff = getPackageEffectivePrice(p);
                              const hasDisc = p.discount_type && eff < p.price;
                              return {
                                value: p.id,
                                label: hasDisc
                                  ? `${p.title} (Rp ${eff.toLocaleString('id-ID')} - Diskon dari Rp ${Number(p.price).toLocaleString('id-ID')})`
                                  : `${p.title} (Rp ${Number(p.price).toLocaleString('id-ID')})`,
                              };
                            })}
                        />
                      </Form.Item>

                      {/* Selected packages preview */}
                      {selectedPkgs.length > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-purple-100 text-xs space-y-2">
                          <div className="font-bold text-on-surface">Paket Terpilih ({selectedPkgs.length} item):</div>
                          <div className="space-y-1">
                            {selectedPkgs.map(sp => {
                              const eff = getPackageEffectivePrice(sp);
                              const hasDisc = sp.discount_type && eff < sp.price;
                              return (
                                <div key={sp.id} className="flex items-center justify-between text-on-surface/70">
                                  <span>• {sp.title}</span>
                                  <span className="font-bold flex items-center gap-1.5">
                                    {hasDisc && (
                                      <span className="text-[10px] text-on-surface/40 line-through">
                                        Rp {Number(sp.price).toLocaleString('id-ID')}
                                      </span>
                                    )}
                                    <span>Rp {eff.toLocaleString('id-ID')}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t border-purple-100 pt-2 flex items-center justify-between font-bold text-purple-900">
                            <span>Total Harga Jual Sub-Paket (Sebelum Diskon Bundle):</span>
                            <span>Rp {origPrice.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}

                      <Row gutter={12}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="bundle_discount_type"
                            label={<span className="font-bold text-xs text-purple-950">Jenis Diskon Bundle</span>}
                            initialValue="fixed"
                          >
                            <Select
                              className="rounded-xl w-full"
                              style={{ height: 42 }}
                              onChange={() => recalculateBundlePrice()}
                              options={[
                                { value: 'fixed', label: 'Potongan Langsung (Rp)' },
                                { value: 'percentage', label: 'Persentase Diskon (%)' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="bundle_discount_value"
                            label={<span className="font-bold text-xs text-purple-950">Nilai Diskon</span>}
                            initialValue={0}
                          >
                            <InputNumber
                              min={0}
                              className="w-full rounded-xl"
                              style={{ height: 42, display: 'flex', alignItems: 'center' }}
                              onChange={() => recalculateBundlePrice()}
                              formatter={discType === 'fixed' ? (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : undefined}
                              parser={discType === 'fixed' ? (v) => Number(v?.replace(/\./g, '') ?? 0) as any : undefined}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Live Calculation Summary */}
                      <div className="bg-purple-600 text-white rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">Harga Jual Akhir Bundle</div>
                          <div className="text-xl font-black font-manrope">Rp {finalPrice.toLocaleString('id-ID')}</div>
                        </div>
                        {hemat > 0 && (
                          <Tag color="gold" className="font-black text-xs px-2.5 py-1 rounded-lg m-0 border-none">
                            Hemat Rp {hemat.toLocaleString('id-ID')}
                          </Tag>
                        )}
                      </div>

                      <Form.Item name="original_price" hidden>
                        <InputNumber />
                      </Form.Item>
                    </div>
                  );
                }}
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="title" label={<span className="font-bold text-sm">Nama Paket / Bundle</span>} rules={[{ required: true, message: 'Harap isi nama paket' }]}>
                <Input placeholder="Cth: Bundle Spesial Saintek + Soshum 2026" className="rounded-xl h-12 text-base" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label={<span className="font-bold text-sm">Deskripsi Singkat</span>} rules={[{ required: true, message: 'Harap isi deskripsi' }]}>
                <TextArea rows={3} placeholder="Gambarkan keunggulan paket / bundle kombo ini..." className="rounded-xl p-3" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="category" label={<span className="font-bold text-sm">Kategori</span>} rules={[{ required: true, message: 'Harap pilih satu kategori' }]}>
                <Select
                  placeholder="Pilih kategori..."
                  className="rounded-xl w-full"
                  style={{ height: 44 }}
                  options={[
                    { value: 'Bundle Hemat', label: '🎁 Bundle Hemat' },
                    { value: 'Intensive Bootcamp', label: 'Intensive Bootcamp' },
                    { value: 'Saintek', label: 'Saintek' },
                    { value: 'Soshum', label: 'Soshum' },
                    { value: 'Tryout', label: 'Tryout' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="status" label={<span className="font-bold text-sm">Status Paket</span>} rules={[{ required: true }]}>
                <Select
                  className="rounded-xl w-full"
                  style={{ height: 44 }}
                  options={[
                    { value: 'published', label: '🟢 Published' },
                    { value: 'draft', label: '🟠 Draft' },
                    { value: 'deleted', label: '🔴 Deleted / Trash' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label={<span className="font-bold text-sm">Thumbnail Paket</span>}>
                <Upload.Dragger
                  accept="image/*"
                  beforeUpload={() => false}
                  maxCount={1}
                  multiple={false}
                  className="rounded-2xl"
                >
                  <div className="py-4">
                    <PictureOutlined className="text-2xl text-primary/40 block mb-2" />
                    <Text className="text-xs font-bold block">Upload Gambar Sampul</Text>
                    <Text className="text-[10px] text-on-surface/40">Rasio 4:3 disarankan</Text>
                  </div>
                </Upload.Dragger>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="classes" label={<span className="font-bold text-sm">Kelas</span>}>
                <Select
                  mode="multiple"
                  placeholder="Pilih kelas..."
                  className="rounded-xl w-full"
                  style={{ height: 'auto', minHeight: 44 }}
                  options={grades.map(g => ({ value: g.title, label: g.title }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="subjects" label={<span className="font-bold text-sm">Mata Pelajaran</span>}>
                <Select
                  mode="multiple"
                  placeholder="Pilih mapel..."
                  className="rounded-xl w-full"
                  style={{ height: 'auto', minHeight: 44 }}
                  options={mapels.map(m => ({ value: m.title, label: m.title }))}
                />
              </Form.Item>
            </Col>

            {/* Hanya untuk Paket Satuan (Single Package) - Paket Bundle disesuaikan dengan sub paketnya */}
            <Col span={24}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_bundle !== curr.is_bundle}>
                {({ getFieldValue }) => {
                  const isBundle = getFieldValue('is_bundle');
                  if (isBundle) return null;
                  return (
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="duration" label={<span className="font-bold text-sm">Durasi Ujian (Menit)</span>} rules={[{ required: true, message: 'Durasi wajib diisi' }]}>
                          <InputNumber min={1} placeholder="120" className="w-full rounded-xl" style={{ height: 44, display: 'flex', alignItems: 'center' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="is_lifetime" label={<span className="font-bold text-sm">Masa Aktif Paket</span>} initialValue={true}>
                          <Select
                            className="rounded-xl w-full"
                            style={{ height: 44 }}
                            options={[
                              { value: true, label: 'Lifetime (Selamanya)' },
                              { value: false, label: 'Terbatas (Hari)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_lifetime !== curr.is_lifetime}>
                          {({ getFieldValue: getFieldVal }) => {
                            const isLifetime = getFieldVal('is_lifetime');
                            if (isLifetime) return null;
                            return (
                              <Form.Item name="validity_days" label={<span className="font-bold text-sm">Jumlah Hari Aktif</span>} rules={[{ required: true, message: 'Wajib diisi' }]}>
                                <InputNumber min={1} placeholder="30" className="w-full rounded-xl" style={{ height: 44, display: 'flex', alignItems: 'center' }} />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="max_exam_attempts" label={<span className="font-bold text-sm">Limit Kesempatan Ujian</span>} initialValue={0} tooltip="Isi 0 untuk unlimited">
                          <InputNumber min={0} placeholder="0 (Unlimited)" className="w-full rounded-xl" style={{ height: 44, display: 'flex', alignItems: 'center' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  );
                }}
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="price" label={<span className="font-bold text-sm">Harga Jual (Rp)</span>} rules={[{ required: true, message: 'Harga wajib diisi' }]}>
                <InputNumber
                  min={0}
                  placeholder="75000"
                  className="w-full rounded-xl"
                  style={{ height: 48, display: 'flex', alignItems: 'center' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(v) => Number(v?.replace(/\./g, '') ?? 0) as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_bundle !== curr.is_bundle}>
                {({ getFieldValue }) => {
                  if (getFieldValue('is_bundle')) return null;
                  return (
                    <Form.Item name="discount_type" label={<span className="font-bold text-sm">Tipe Diskon Satuan</span>} initialValue="">
                      <Select
                        className="rounded-xl w-full"
                        style={{ height: 48 }}
                        options={[
                          { value: '', label: 'Tidak Ada Diskon' },
                          { value: 'percent', label: 'Persen (%)' },
                          { value: 'harga', label: 'Nominal (Rp)' },
                        ]}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.discount_type !== curr.discount_type || prev.is_bundle !== curr.is_bundle}>
                {({ getFieldValue }) => {
                  if (getFieldValue('is_bundle')) return null;
                  const type = getFieldValue('discount_type');
                  if (!type) return null;
                  return (
                    <Form.Item
                      name="discount_value"
                      label={<span className="font-bold text-sm">Nilai Diskon</span>}
                      rules={[{ required: true, message: 'Wajib diisi' }]}
                    >
                      <InputNumber
                        min={0}
                        max={type === 'percent' ? 100 : undefined}
                        placeholder={type === 'percent' ? "10" : "15000"}
                        className="w-full rounded-xl"
                        style={{ height: 48, display: 'flex', alignItems: 'center' }}
                        formatter={type === 'harga' ? (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : undefined}
                        parser={type === 'harga' ? (v) => Number(v?.replace(/\./g, '') ?? 0) as any : undefined}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminPackageForm;
