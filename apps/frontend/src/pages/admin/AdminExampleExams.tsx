import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Typography, Space, Divider, message, Row, Col, Radio, Popconfirm, Pagination, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getExampleExams, createExampleExam, updateExampleExam, deleteExampleExam, ExampleExam } from '../../services/exampleExamService';
import KantanEditor from '../../components/atoms/KantanEditor';

const { Title, Text } = Typography;

const AdminExampleExams: React.FC = () => {
  const [data, setData] = useState<ExampleExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  const [activeId, setActiveId] = useState<number | 'new' | null>(null);
  const [formState, setFormState] = useState<Partial<ExampleExam>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getExampleExams(currentPage, perPage, '');
      setData(response.rows); 
      setTotal(response.total);
      if (response.rows.length > 0 && activeId === null) {
        setActiveId(response.rows[0].id);
        setFormState(response.rows[0]);
      }
    } catch (error) {
      message.error('Gagal mengambil data soal landing page');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, activeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setActiveId('new');
    setFormState({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      answer: 'A',
      explanation: '',
    });
  };

  const handleSelect = (record: ExampleExam) => {
    setActiveId(record.id);
    setFormState(record);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExampleExam(id);
      message.success('Soal berhasil dihapus');
      if (activeId === id) setActiveId(null);
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus soal');
    }
  };

  const handleSave = async () => {
    if (!formState.question || !formState.answer) {
      message.warning('Pertanyaan dan kunci jawaban tidak boleh kosong');
      return;
    }
    
    setIsSaving(true);
    try {
      if (activeId === 'new') {
        const res = await createExampleExam(formState);
        message.success('Soal baru ditambahkan');
        setActiveId(res.data?.id);
      } else if (activeId) {
        await updateExampleExam(activeId, formState);
        message.success('Soal diperbarui');
      }
      fetchData();
    } catch (error) {
      message.error('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const updateForm = (key: keyof ExampleExam, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 min-h-full py-10 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="mb-8">
             <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100">
               Kelola Soal Landing Page
             </Title>
             <Text className="text-on-surface/50 font-medium">Buat dan atur soal-soal latihan yang muncul di halaman depan.</Text>
          </div>

          <Row gutter={24}>
            {/* ── LEFT: Question List Sidebar ── */}
            <Col xs={24} md={6}>
              <Card className="weightless-card border-none bg-surface-low/30 dark:bg-zinc-900 shadow-sm rounded-3xl p-3 mb-6">
                <div className="flex items-center justify-between px-2 mb-4">
                  <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40">Daftar Soal</Text>
                  <Button type="primary" ghost size="small" icon={<PlusOutlined />} onClick={handleAdd} className="rounded-lg font-bold text-[10px] h-7">Tambah</Button>
                </div>
                
                {loading && data.length === 0 ? (
                  <div className="py-10 text-center"><Spin /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-2">
                      {data.map((q, i) => {
                        const globalIndex = (currentPage - 1) * perPage + i + 1;
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleSelect(q)}
                            className={`h-10 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-all border-2
                              ${activeId === q.id
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                : 'bg-white dark:bg-zinc-800 border-transparent text-on-surface/60 hover:border-primary/30'}`}
                          >
                            {globalIndex}
                          </div>
                        );
                      })}
                      <div onClick={handleAdd} className={`h-10 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${activeId === 'new' ? 'border-primary text-primary bg-primary/10' : 'border-primary/20 text-primary/40 hover:text-primary hover:border-primary/40'}`}>
                        <PlusOutlined />
                      </div>
                    </div>
                    
                    <Divider className="my-4 border-on-surface/5" />
                    
                    <div className="flex justify-center mt-4">
                      <Pagination 
                        current={currentPage}
                        total={total}
                        pageSize={perPage}
                        onChange={p => setCurrentPage(p)}
                        size="small"
                        showSizeChanger={false}
                      />
                    </div>
                    
                    {activeId && activeId !== 'new' && (
                      <div className="mt-4 px-2">
                        <Popconfirm
                           title="Hapus Soal"
                           description="Yakin ingin menghapus soal ini?"
                           onConfirm={() => handleDelete(activeId as number)}
                           okText="Hapus"
                           cancelText="Batal"
                           okButtonProps={{ danger: true }}
                        >
                           <Button danger ghost block icon={<DeleteOutlined />} size="small" className="rounded-lg font-bold h-9">
                             Hapus Soal Aktif
                           </Button>
                        </Popconfirm>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </Col>

            {/* ── RIGHT: Question Editor ── */}
            <Col xs={24} md={18}>
               {!activeId ? (
                 <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md rounded-[2.5rem] p-4 lg:p-8 flex items-center justify-center min-h-[500px]">
                   <div className="text-center text-on-surface/40">
                      <div className="text-6xl mb-4 opacity-30"><EyeOutlined /></div>
                      <p className="font-bold">Pilih soal dari daftar di sebelah kiri atau tambah soal baru.</p>
                   </div>
                 </Card>
               ) : (
               <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md rounded-[2.5rem] p-4 lg:p-8 !overflow-visible">
                   
                   <div className="mb-8">
                     <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">
                       Pertanyaan Utama
                     </Text>
                     <KantanEditor
                       value={formState.question}
                       onChange={(val) => updateForm('question', val)}
                       placeholder="Tuliskan teks pertanyaan di sini..."
                       rows={5}
                     />
                   </div>

                   <div className="mb-8">
                     <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">
                       Pembahasan Singkat
                     </Text>
                     <KantanEditor
                       value={formState.explanation}
                       onChange={(val) => updateForm('explanation', val)}
                       placeholder="Blok teks yang ingin Anda format. Tuliskan pembahasan soal di sini..."
                       rows={4}
                       theme="bubble"
                     />
                   </div>

                   <div className="space-y-4">
                     <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Opsi Jawaban & Kunci</Text>
                     
                     <div className="grid grid-cols-1 gap-4">
                       {['A', 'B', 'C', 'D'].map((opt) => {
                         const optKey = `option_${opt.toLowerCase()}` as keyof ExampleExam;
                         const isCorrect = formState.answer === opt;
                         
                         return (
                           <div key={opt} className="flex items-start gap-4 group">
                             <Radio
                               checked={isCorrect}
                               onChange={() => updateForm('answer', opt)}
                               className="scale-125 mt-3"
                             />
                             <div className={`flex-1 flex flex-col p-1 rounded-lg border-2 transition-all 
                               ${isCorrect
                                 ? 'bg-green-50/50 dark:bg-green-900/10 border-green-500/50'
                                 : 'bg-surface-low/50 dark:bg-zinc-800 border-transparent hover:border-on-surface/5'}`}>
                               <div className="flex items-start gap-3">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border-2 mt-1
                                    ${isCorrect
                                     ? 'bg-green-500 border-green-500 text-white'
                                     : 'bg-white dark:bg-zinc-700 border-on-surface/10 text-on-surface/40'}`}>
                                   {opt}
                                 </div>
                                 <KantanEditor
                                   value={formState[optKey] as string}
                                   onChange={val => updateForm(optKey, val)}
                                   placeholder={`Ketik opsi ${opt}, blok untuk format...`}
                                   rows={3}
                                   className="flex-1"
                                   theme="bubble"
                                 />
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   <Divider className="my-10 border-on-surface/5" />

                   <div className="flex items-center justify-between">
                     <Space>
                       {/* Add extra tools here if needed */}
                     </Space>
                     <Button 
                        type="primary" 
                        icon={<SaveOutlined />} 
                        size="large" 
                        className="rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                        onClick={handleSave}
                        loading={isSaving}
                      >
                       {activeId === 'new' ? 'Simpan Soal Baru' : 'Simpan Perubahan'}
                     </Button>
                   </div>
                 </Card>
               )}
            </Col>
          </Row>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExampleExams;
