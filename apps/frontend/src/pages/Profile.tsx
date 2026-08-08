import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Row, Col, Avatar, Button, Card, Form, Input, Switch, Badge, Divider, Tag } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  WhatsAppOutlined, 
  EditOutlined, 
  SafetyCertificateOutlined, 
  BellOutlined, 
  TrophyOutlined, 
  RocketOutlined, 
  HistoryOutlined,
  SaveOutlined,
  StarOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getUserDashboardStatsAPI, UserDashboardStats } from '../services/dashboardService';
import { getProfileAPI, updateProfileAPI, User as UserProfile, UpdateProfilePayload } from '../services/userService';
import PageLoader from '../components/atoms/PageLoader';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<UserDashboardStats | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();

  const fetchProfile = async (id: number) => {
    try {
      const data = await getProfileAPI(id);
      setProfileData(data);
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        whatsapp: data.nohp,
        school: data.asal_sekolah,
        dreamDescription: data.dream_description,
        target_campus: data.target_campus,
        target_major: data.target_major,
        target_point: data.target_point,
      });
    } catch (error) {
      message.error('Gagal memuat profil');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    if (user?.id) {
      getUserDashboardStatsAPI(user.id).then(setDashboardStats);
      fetchProfile(user.id);
    }

    return () => clearTimeout(timer);
  }, [user]);

  const handleSave = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }

    try {
      const values = await form.validateFields();
      if (!user?.id) return;
      
      const payload: UpdateProfilePayload = {
        name: values.name,
        email: values.email,
        nohp: values.whatsapp,
        asal_sekolah: values.school,
        dream_description: values.dreamDescription,
        target_campus: values.target_campus,
        target_major: values.target_major,
        target_point: values.target_point,
      };

      const updated = await updateProfileAPI(user.id, payload);
      setProfileData(updated);
      message.success('Profil berhasil diperbarui!');
      setEditing(false);
    } catch (error) {
      message.error('Gagal memperbarui profil, silakan periksa isian Anda.');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Row gutter={[48, 48]}>
            {/* Left Column: Avatar & Quick Stats */}
            <Col xs={24} lg={8}>
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <Card className="border-none glass rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 text-center p-8">
                  <div className="relative inline-block mb-6">
                    <Avatar 
                      size={160} 
                      src={user?.avatar} 
                      icon={<UserOutlined />} 
                      className="border-8 border-white shadow-xl ring-1 ring-on-surface/5"
                    />
                    <div className="absolute bottom-2 right-2">
                       <Badge status="success" className="scale-150" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Title level={2} className="!font-manrope !m-0 !font-black tracking-tight">{user?.name}</Title>
                    <Tag color="blue" className="rounded-full px-4 border-none font-bold uppercase tracking-widest text-[10px]">Premium Member</Tag>
                  </div>

                  <Divider className="my-8" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-3xl bg-surface-low">
                      <Title level={4} className="!m-0 !font-black !text-primary">{dashboardStats?.total_exams || 0}</Title>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Tryout Diikuti</Text>
                    </div>
                    <div className="text-center p-4 rounded-3xl bg-surface-low">
                      <Title level={4} className="!m-0 !font-black !text-secondary">{Math.round(dashboardStats?.avg_score || 0)}</Title>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Rata-rata Skor</Text>
                    </div>
                  </div>
                </Card>

                {/* Achievements Card */}
                <Card className="border-none glass rounded-[32px] p-6 shadow-xl shadow-primary/5">
                    <div className="flex items-center justify-between mb-6">
                        <Title level={5} className="!font-manrope !m-0">Pencapaian</Title>
                        <TrophyOutlined className="text-xl text-yellow-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <RocketOutlined className="text-primary" />
                            </div>
                            <div>
                                <Text className="block font-bold text-sm">Konsisten Belajar</Text>
                                <Text className="text-xs text-on-surface/40">7 hari berturut-turut</Text>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                <HistoryOutlined className="text-secondary" />
                            </div>
                            <div>
                                <Text className="block font-bold text-sm">Penyelamat Skor</Text>
                                <Text className="text-xs text-on-surface/40">Naik 100 poin dalam 1 bulan</Text>
                            </div>
                        </div>
                    </div>
                </Card>
              </div>
            </Col>

            {/* Right Column: Detailed Info & Settings */}
            <Col xs={24} lg={16}>
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                {/* Personal Information */}
                <Card 
                  className="border-none bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5"
                  title={
                    <div className="flex justify-between items-center w-full">
                        <Title level={3} className="!font-manrope !m-0 !font-black tracking-tight">Informasi Pribadi</Title>
                        <Button 
                          type={editing ? "primary" : "text"} 
                          icon={editing ? <SaveOutlined /> : <EditOutlined />} 
                          onClick={handleSave}
                          className={editing ? "rounded-full px-6" : "text-primary font-bold"}
                        >
                            {editing ? "Simpan Perubahan" : "Edit Profil"}
                        </Button>
                    </div>
                  }
                >
                  <Form
                    form={form}
                    layout="vertical"
                    disabled={!editing}
                  >
                    <Row gutter={24}>
                      <Col xs={24} md={12}>
                        <Form.Item name="name" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Nama Lengkap</Text>}>
                          <Input className="h-12 rounded-xl bg-surface-low border-none font-bold" prefix={<UserOutlined className="opacity-20" />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="email" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Alamat Email</Text>}>
                          <Input disabled className="h-12 rounded-xl bg-surface-low border-none font-bold text-on-surface/50" prefix={<MailOutlined className="opacity-20" />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="whatsapp" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Nomor WhatsApp</Text>}>
                          <Input disabled className="h-12 rounded-xl bg-surface-low border-none font-bold text-on-surface/50" prefix={<WhatsAppOutlined className="opacity-20" />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="school" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Asal Sekolah</Text>}>
                          <Input className="h-12 rounded-xl bg-surface-low border-none font-bold" prefix={<BankOutlined className="opacity-20" />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider className="my-8" />
                    
                    <div className="flex items-center gap-2 mb-6">
                        <BulbOutlined className="text-secondary" />
                        <Title level={4} className="!font-manrope !m-0 !font-black tracking-tight">Vision Board</Title>
                    </div>

                    <Row gutter={24}>
                      <Col span={24}>
                        <Form.Item name="dreamDescription" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Dream Description (Apa Targetmu?)</Text>}>
                          <Input.TextArea rows={3} className="rounded-2xl bg-surface-low border-none font-medium p-4" placeholder="Tuliskan cita-cita besarmu di sini..." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="target_campus" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Target Kampus / Sekolah</Text>}>
                          <Input className="h-12 rounded-xl bg-surface-low border-none font-bold" prefix={<BankOutlined className="opacity-20" />} placeholder="Cth: Universitas Indonesia" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="target_major" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Target Jurusan</Text>}>
                          <Input className="h-12 rounded-xl bg-surface-low border-none font-bold" prefix={<CheckSquareOutlined className="opacity-20" />} placeholder="Cth: Kedokteran" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="target_point" label={<Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Target Skor / Point</Text>}>
                          <Input className="h-12 rounded-xl bg-surface-low border-none font-bold" prefix={<StarOutlined className="opacity-20" />} placeholder="Cth: 750" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                {/* Account Security & Notifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none bg-white rounded-[32px] p-6 shadow-xl shadow-primary/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <SafetyCertificateOutlined className="text-blue-500" />
                            </div>
                            <Title level={5} className="!font-manrope !m-0">Keamanan</Title>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Text className="text-sm font-medium">Verifikasi 2 Langkah</Text>
                                <Switch size="small" defaultChecked />
                            </div>
                            <Button block type="dashed" className="rounded-xl font-bold">Ubah Kata Sandi</Button>
                        </div>
                    </Card>

                    <Card className="border-none bg-white rounded-[32px] p-6 shadow-xl shadow-primary/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                <BellOutlined className="text-purple-500" />
                            </div>
                            <Title level={5} className="!font-manrope !m-0">Notifikasi</Title>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Text className="text-sm font-medium">Pengingat Tryout</Text>
                                <Switch size="small" defaultChecked />
                            </div>
                            <div className="flex justify-between items-center">
                                <Text className="text-sm font-medium">Promo & Diskon</Text>
                                <Switch size="small" />
                            </div>
                        </div>
                    </Card>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
