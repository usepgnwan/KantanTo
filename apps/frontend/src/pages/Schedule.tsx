import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Calendar, Badge, Modal, Drawer, Button, Form, Select, Input, List, Space, Popconfirm, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { DeleteOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { getSchedulesAPI, createScheduleAPI, deleteScheduleAPI, StudySchedule, CreateSchedulePayload } from '../services/scheduleService';
import { getMyPackagesAPI, MyTransaction } from '../services/myPackageService';

dayjs.locale('id');

const { Title, Text, Paragraph } = Typography;

const Schedule: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [myPackages, setMyPackages] = useState<MyTransaction[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<'latihan' | 'reminder'>('latihan');

  const loadSchedules = async () => {
    if (user?.id) {
      try {
        const data = await getSchedulesAPI(user.id);
        setSchedules(data || []);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const loadPackages = async () => {
    if (user?.id) {
      try {
        const data = await getMyPackagesAPI(user.id, 'active');
        setMyPackages(data || []);
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    loadSchedules();
    loadPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSelect = (date: Dayjs, info: { source: 'year' | 'month' | 'date' | 'customize' }) => {
    setSelectedDate(date);
    if (info.source === 'date') {
      setIsDrawerVisible(true);
    }
  };

  const onPanelChange = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = schedules.filter(s => dayjs(s.date).isSame(value, 'day'));
    return (
      <ul className="events p-0 m-0 list-none">
        {listData.map(item => (
          <li key={item.id} className="truncate text-xs mb-1">
            <Badge 
              color={item.type === 'latihan' ? 'blue' : 'orange'} 
              text={
                <span className="text-xs truncate w-full inline-block align-bottom max-w-[100px] lg:max-w-[150px]">
                  {item.type === 'latihan' ? (item.package?.title || 'Latihan') : item.reminder_text}
                </span>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender = (current: Dayjs, info: { type: string; originNode: React.ReactNode }) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  const schedulesForSelectedDate = useMemo(() => {
    return schedules.filter(s => dayjs(s.date).isSame(selectedDate, 'day'));
  }, [schedules, selectedDate]);

  const handleAddSchedule = async (values: any) => {
    if (!user?.id) return;
    
    const payload: CreateSchedulePayload = {
      user_id: user.id,
      date: selectedDate.format('YYYY-MM-DD'),
      type: values.type,
      package_id: values.package_id,
      reminder_text: values.reminder_text,
    };

    try {
      await createScheduleAPI(payload);
      message.success('Jadwal berhasil ditambahkan!');
      setIsModalVisible(false);
      form.resetFields();
      loadSchedules();
    } catch (error) {
      message.error('Gagal menambahkan jadwal');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await deleteScheduleAPI(id);
      message.success('Jadwal berhasil dihapus!');
      loadSchedules();
    } catch (error) {
      message.error('Gagal menghapus jadwal');
    }
  };

  return (
    <AppLayout>
      <div className="bg-surface-low/30 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-12">
            <Text className="text-sm font-heavy uppercase tracking-[0.2em] text-on-surface/40 leading-none mb-2 block">
              Manajemen Waktu
            </Text>
            <Title level={1} className="!m-0 !font-black !text-5xl !font-manrope">Jadwal Belajar</Title>
            <Paragraph className="text-on-surface/60 text-lg mt-4 max-w-2xl">
              Atur jadwal tryout dan buat pengingat harian agar belajarmu lebih konsisten dan terarah.
            </Paragraph>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-surface-container">
            <Calendar 
              value={selectedDate} 
              onSelect={onSelect} 
              onPanelChange={onPanelChange} 
              cellRender={cellRender}
              className="custom-calendar [&_.ant-picker-calendar-date-content]:h-[80px]"
            />
          </div>

        </div>
      </div>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-primary" />
            <span>Jadwal: {selectedDate.format('DD MMMM YYYY')}</span>
          </div>
        }
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={400}
        extra={
          selectedDate.startOf('day').isBefore(dayjs().startOf('day')) ? null : (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} className="rounded-xl font-bold">
              Tambah
            </Button>
          )
        }
      >
        {schedulesForSelectedDate.length === 0 ? (
          <div className="text-center py-12">
            <CalendarOutlined className="text-4xl text-on-surface/20 mb-4" />
            <Text className="block text-on-surface/40">Belum ada jadwal untuk tanggal ini.</Text>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={schedulesForSelectedDate}
            renderItem={item => (
              <List.Item
                className="bg-surface-low/50 p-4 rounded-2xl mb-4 border border-surface-container"
                actions={[
                  <Popconfirm
                    title="Hapus jadwal ini?"
                    onConfirm={() => handleDeleteSchedule(item.id)}
                    okText="Ya"
                    cancelText="Batal"
                    okButtonProps={{ danger: true, className: 'rounded-lg font-bold' }}
                    cancelButtonProps={{ className: 'rounded-lg font-bold' }}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} shape="circle" />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Badge status={item.type === 'latihan' ? 'processing' : 'warning'} />
                      <Text className="font-bold capitalize">{item.type === 'latihan' ? 'Latihan Tryout' : 'Pengingat'}</Text>
                    </Space>
                  }
                  description={
                    <Text className="text-sm mt-2 block text-on-surface/80">
                      {item.type === 'latihan' ? (
                        <>Paket: <Text className="font-bold">{item.package?.title}</Text></>
                      ) : (
                        item.reminder_text
                      )}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <Modal
        title={
          <div className="font-bold text-lg">Tambah Jadwal Baru</div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
        className="[&_.ant-modal-content]:rounded-[2rem] [&_.ant-modal-content]:p-8"
      >
        <Text className="block mb-6 text-on-surface/60">
          Tanggal: <Text className="font-bold text-primary">{selectedDate.format('DD MMMM YYYY')}</Text>
        </Text>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSchedule}
          initialValues={{ type: 'latihan' }}
        >
          <Form.Item
            name="type"
            label={<span className="font-bold">Tipe Jadwal</span>}
            rules={[{ required: true, message: 'Pilih tipe jadwal' }]}
          >
            <Select 
              className="h-12 [&_.ant-select-selector]:rounded-2xl [&_.ant-select-selector]:h-12 [&_.ant-select-selection-item]:leading-[44px]"
              onChange={(val) => setSelectedType(val)}
            >
              <Select.Option value="latihan">Latihan Tryout</Select.Option>
              <Select.Option value="reminder">Pengingat Pribadi</Select.Option>
            </Select>
          </Form.Item>

          {selectedType === 'latihan' ? (
            <Form.Item
              name="package_id"
              label={<span className="font-bold">Pilih Paket</span>}
              rules={[{ required: true, message: 'Pilih paket latihan' }]}
            >
              <Select 
                className="h-12 [&_.ant-select-selector]:rounded-2xl [&_.ant-select-selector]:h-12 [&_.ant-select-selection-item]:leading-[44px]"
                placeholder="Pilih paket yang dimiliki"
                options={myPackages.map(tx => ({
                  value: tx.package?.id,
                  label: tx.package?.title
                }))}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="reminder_text"
              label={<span className="font-bold">Teks Pengingat</span>}
              rules={[
                { required: true, message: 'Masukkan pengingat' },
                { max: 300, message: 'Maksimal 300 karakter' }
              ]}
            >
              <Input.TextArea 
                placeholder="Contoh: Belajar Penalaran Umum bab 1-3..." 
                className="rounded-2xl" 
                rows={4}
                showCount
                maxLength={300}
              />
            </Form.Item>
          )}

          <Form.Item className="mb-0 mt-8">
            <Button type="primary" htmlType="submit" block className="h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
              Simpan Jadwal
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </AppLayout>
  );
};

export default Schedule;
