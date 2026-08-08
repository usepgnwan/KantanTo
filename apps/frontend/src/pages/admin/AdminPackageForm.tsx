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
  TagsOutlined, EditOutlined, EyeOutlined, ClockCircleOutlined,
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
    form.setFieldsValue({ status: 'draft', classes: [], subjects: [], duration: 120, price: 0 });
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
    });
    setModalOpen(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const vals = await form.validateFields();
    setSubmitting(true);
    try {
      if (editTarget) {
        // Update existing
        const updated = await updatePackage(editTarget.slug, {
          slug: editTarget.slug,
          title: vals.title,
          description: vals.description,
          price: vals.price ?? 0,
          category: vals.category ?? '',
          classes: vals.classes ?? [],
          subjects: vals.subjects ?? [],
          duration: vals.duration ?? 0,
          status: vals.status ?? 'draft',
          thumbnail: editTarget.thumbnail,
        });
        setPackages(prev =>
          prev.map(p => p.slug === editTarget.slug ? toRow(updated) : p)
        );
        message.success('Paket berhasil diperbarui');
      } else {
        // Create new — auto-generate slug from title
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
          title: vals.title,
          description: vals.description,
          price: vals.price ?? 0,
          category: vals.category ?? '',
          classes: vals.classes ?? [],
          subjects: vals.subjects ?? [],
          duration: vals.duration ?? 0,
          status: vals.status ?? 'draft',
          thumbnail: '',
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
      label: 'Edit Info Paket',
      icon: <EditOutlined />,
      onClick: () => openEdit(pkg),
    },
    {
      key: 'settings',
      label: 'Kelola Soal & Materi',
      icon: <SettingOutlined />,
      onClick: () => navigate(`/admin/packages/${pkg.slug}`),
    },
    {
      key: 'preview',
      label: 'Lihat di Halaman Siswa',
      icon: <EyeOutlined />,
      onClick: () => window.open(`/paket/${pkg.slug}`, '_blank'),
    },
    { type: 'divider' },
    pkg.status === 'deleted'
      ? {
          key: 'restore',
          label: 'Pulihkan Paket',
          icon: <PlusOutlined />,
          onClick: () => { handleStatusChange(pkg, 'draft'); message.success('Paket dipulihkan ke Draft'); },
        }
      : {
          key: 'delete',
          label: 'Hapus (Pindah ke Trash)',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => { handleStatusChange(pkg, 'deleted'); message.warning('Paket dipindah ke status Deleted'); },
        },
    {
      key: 'perm-delete',
      label: 'Hapus Permanen',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handlePermanentDelete(pkg),
    },
  ];

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: TableColumnsType<PackageRow> = [
    {
      title: 'Paket',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            className="bg-primary/10 text-primary shrink-0 text-lg font-black rounded-xl"
            shape="square"
          >
            {title?.[0] ?? '?'}
          </Avatar>
          <div>
            <span className="font-bold block text-on-surface dark:text-zinc-100">{title}</span>
            <Text className="text-xs text-on-surface/40 dark:text-zinc-500 line-clamp-1">{record.description}</Text>
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
      render: (dur) => (
        <Space className="text-on-surface/60 dark:text-zinc-400">
          <ClockCircleOutlined />
          <span className="text-xs font-bold">{dur} Menit</span>
        </Space>
      ),
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => (
        <span className="font-black text-primary">
          {price === 0 ? 'Gratis' : `Rp ${Number(price).toLocaleString('id-ID')}`}
        </span>
      ),
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
              <Text className="text-on-surface/50 dark:text-zinc-400 text-sm">Kelola katalog paket, durasi, dan akses pengerjaan siswa</Text>
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
              { label: 'Published', value: packages.filter(p => p.status === 'published').length, color: 'text-green-500' },
              { label: 'Draft / Inactive', value: packages.filter(p => p.status === 'draft').length, color: 'text-orange-500' },
              { label: 'Deleted', value: packages.filter(p => p.status === 'deleted').length, color: 'text-red-500' },
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
        width={560}
        centered
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-4">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="title" label={<span className="font-bold text-sm">Nama Paket</span>} rules={[{ required: true, message: 'Harap isi nama paket' }]}>
                <Input placeholder="Cth: Saintek Pro Batch 1" className="rounded-xl h-12 text-base" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label={<span className="font-bold text-sm">Deskripsi Singkat</span>} rules={[{ required: true, message: 'Harap isi deskripsi' }]}>
                <TextArea rows={3} placeholder="Gambarkan keunggulan paket ini..." className="rounded-xl p-3" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="category" label={<span className="font-bold text-sm">Kategori</span>} rules={[{ required: true, message: 'Harap pilih satu kategori' }]}>
                <Select
                  placeholder="Pilih kategori..."
                  className="rounded-xl w-full"
                  style={{ height: 44 }}
                  options={[
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
              <Form.Item name="classes" label={<span className="font-bold text-sm">Kelas</span>} rules={[{ required: true }]}>
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
              <Form.Item name="subjects" label={<span className="font-bold text-sm">Mata Pelajaran</span>} rules={[{ required: true }]}>
                <Select
                  mode="multiple"
                  placeholder="Pilih mapel..."
                  className="rounded-xl w-full"
                  style={{ height: 'auto', minHeight: 44 }}
                  options={mapels.map(m => ({ value: m.title, label: m.title }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="duration" label={<span className="font-bold text-sm">Durasi (Menit)</span>} rules={[{ required: true, message: 'Durasi wajib diisi' }]}>
                <InputNumber min={1} placeholder="120" className="w-full rounded-xl" style={{ height: 44, display: 'flex', alignItems: 'center' }} />
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
          </Row>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminPackageForm;
