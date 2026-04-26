import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Card, Table, Button, Tag, Typography, Space, Modal,
  Form, Input, InputNumber, Dropdown, message, Avatar,
  Col, Row, Select, Upload,
} from 'antd';
import type { TableColumnsType, MenuProps } from 'antd';
import {
  PlusOutlined, SettingOutlined, DeleteOutlined, MoreOutlined,
  TagsOutlined, EditOutlined, EyeOutlined, ClockCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Package {
  key: string;
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail?: string;
  classes: string[];
  subjects: string[];
  duration: number; // in minutes
  questionsCount: number;
  materialsCount: number;
  videosCount: number;
  status: 'published' | 'draft' | 'deleted';
}

const initialPackages: Package[] = [
  { 
    key: '1', id: 'saintek-pro', title: 'Saintek Pro', 
    description: 'Paket intensif untuk jalur Saintek dengan 500+ soal terseleksi.', 
    price: 75000, 
    category: 'Saintek', 
    classes: ['Kelas 12', 'Alumni'],
    subjects: ['Matematika IPA', 'Fisika', 'Kimia'],
    duration: 120, questionsCount: 120, materialsCount: 8, videosCount: 4, status: 'published' 
  },
  { 
    key: '2', id: 'soshum-mastery', title: 'Soshum Mastery', 
    description: 'Kuasai seluruh materi Soshum dengan pembahasan eksklusif.', 
    price: 85000, 
    category: 'Soshum', 
    classes: ['Kelas 12'],
    subjects: ['Sejarah', 'Geografi', 'Sosiologi'],
    duration: 120, questionsCount: 98, materialsCount: 6, videosCount: 3, status: 'published' 
  },
  { 
    key: '3', id: 'tryout-akbar', title: 'Tryout Akbar', 
    description: 'Simulasi ujian massal dengan soal prediktif terkini.', 
    price: 25000, 
    category: 'Tryout', 
    classes: ['Kelas 10', 'Kelas 11', 'Kelas 12', 'Alumni'],
    subjects: ['TPS', 'Literasi'],
    duration: 195, questionsCount: 150, materialsCount: 2, videosCount: 1, status: 'published' 
  },
];

const AdminPackageForm: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Package | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (pkg: Package) => { setEditTarget(pkg); form.setFieldsValue(pkg); setModalOpen(true); };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    if (editTarget) {
      setPackages(packages.map(p => p.key === editTarget.key ? { ...p, ...vals } : p));
      message.success('Paket berhasil diperbarui');
    } else {
      const newPkg: Package = {
        key: String(Date.now()),
        id: vals.title.toLowerCase().replace(/\s+/g, '-'),
        questionsCount: 0, materialsCount: 0, videosCount: 0,
        status: 'draft',
        ...vals,
      };
      setPackages([...packages, newPkg]);
      message.success('Paket baru berhasil dibuat');
    }
    setModalOpen(false);
  };

  const rowActions = (pkg: Package): MenuProps['items'] => [
    { key: 'edit', label: 'Edit Info Paket', icon: <EditOutlined />, onClick: () => openEdit(pkg) },
    { key: 'settings', label: 'Kelola Soal & Materi', icon: <SettingOutlined />, onClick: () => navigate(`/admin/packages/${pkg.id}`) },
    { key: 'preview', label: 'Lihat di Halaman Siswa', icon: <EyeOutlined />, onClick: () => window.open(`/paket/${pkg.id}`, '_blank') },
    { type: 'divider' },
    pkg.status === 'deleted' 
      ? { key: 'restore', label: 'Pulihkan Paket', icon: <PlusOutlined />, onClick: () => { setPackages(packages.map(p => p.key === pkg.key ? { ...p, status: 'draft' } : p)); message.success('Paket dipulihkan ke Draft'); } }
      : { key: 'delete', label: 'Hapus (Pindah ke Trash)', icon: <DeleteOutlined />, danger: true, onClick: () => { setPackages(packages.map(p => p.key === pkg.key ? { ...p, status: 'deleted' } : p)); message.warning('Paket dipindah ke status Deleted'); } },
    { key: 'perm-delete', label: 'Hapus Permanen', icon: <DeleteOutlined />, danger: true, onClick: () => { setPackages(packages.filter(p => p.key !== pkg.key)); message.error('Paket dihapus selamanya'); } },
  ];

  const columns: TableColumnsType<Package> = [
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
            {title[0]}
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
          <Tag className="rounded-lg bg-primary/10 text-primary border-none font-bold text-[9px] px-2 w-fit">{record.category}</Tag>
          <Space size={2} wrap>
            {record.classes.map(c => <Tag key={c} className="rounded-lg bg-on-surface/5 text-on-surface/40 border-none font-bold text-[9px] px-2 m-0">{c}</Tag>)}
          </Space>
           <Space size={2} wrap>
            {record.subjects.map(s => <Tag key={s} className="rounded-lg bg-blue-500/10 text-blue-500 border-none font-bold text-[9px] px-2 m-0">{s}</Tag>)}
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
          {price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`}
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
            {r.questionsCount} soal
          </Tag>
          <Tag className="rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-none font-bold text-[10px] px-2">
            {r.materialsCount} materi
          </Tag>
          <Tag className="rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-none font-bold text-[10px] px-2">
            {r.videosCount} video
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
        return (
          <Tag color={color} className="rounded-full font-bold px-3">
            {label}
          </Tag>
        );
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
            onClick={() => navigate(`/admin/packages/${record.id}`)}
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreate}
              className="mt-4 sm:mt-0 h-11 rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
              Tambah Paket
            </Button>
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
            <Table
              columns={columns}
              dataSource={packages}
              pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} paket` }}
              scroll={{ x: 800 }}
              className="weightless-table"
            />
          </Card>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
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
                  multiple={false}
                  className="rounded-2xl"
                >
                  <div className="py-4">
                    <PictureOutlined className="text-2xl text-primary/40 block mb-2" />
                    <Text className="text-xs font-bold block">Upload Gambar Sampulan</Text>
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
                  options={[
                    { value: 'Kelas 10', label: 'Kelas 10' },
                    { value: 'Kelas 11', label: 'Kelas 11' },
                    { value: 'Kelas 12', label: 'Kelas 12' },
                    { value: 'Alumni', label: 'Alumni' },
                  ]}
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
                  options={[
                    { value: 'Matematika IPA', label: 'Matematika IPA' },
                    { value: 'Fisika', label: 'Fisika' },
                    { value: 'Kimia', label: 'Kimia' },
                    { value: 'Sejarah', label: 'Sejarah' },
                    { value: 'Geografi', label: 'Geografi' },
                    { value: 'Sosiologi', label: 'Sosiologi' },
                    { value: 'TPS', label: 'TPS' },
                    { value: 'Literasi', label: 'Literasi' },
                  ]}
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
