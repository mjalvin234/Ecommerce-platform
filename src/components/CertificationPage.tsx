import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, CheckCircle2, XCircle, Clock, FileText, Building2, X, Image as ImageIcon, File } from 'lucide-react';
import { api } from '../api/client';

interface CertificationPageProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface FileUpload {
  file: File | null;
  url: string;
  uploading: boolean;
  preview?: string;
}

export const CertificationPage: React.FC<CertificationPageProps> = ({ onClose, showToast }) => {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [certInfo, setCertInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'enterprise' as 'enterprise' | 'individual',
    companyName: '',
    creditCode: '',
    legalPerson: '',
    legalIdCard: '',
    contactPhone: '',
    contactEmail: '',
    businessAddress: '',
    businessLicense: '',
    legalIdCardFront: '',
    legalIdCardBack: '',
    bankAccountLicense: '',
  });

  // 文件上传状态
  const [files, setFiles] = useState<{
    businessLicense: FileUpload;
    legalIdCardFront: FileUpload;
    legalIdCardBack: FileUpload;
    bankAccountLicense: FileUpload;
  }>({
    businessLicense: { file: null, url: '', uploading: false },
    legalIdCardFront: { file: null, url: '', uploading: false },
    legalIdCardBack: { file: null, url: '', uploading: false },
    bankAccountLicense: { file: null, url: '', uploading: false },
  });

  useEffect(() => {
    loadCertification();
  }, []);

  const loadCertification = async () => {
    try {
      const result = await api.get('/certifications/my');
      if (result) {
        setCertInfo(result);
        setStatus(result.status);
      }
    } catch (err) {
      console.error('加载认证状态失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (
    field: keyof typeof files,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showToast('仅支持 JPG、PNG、PDF 格式');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      showToast('文件大小不能超过 5MB');
      return;
    }

    // 生成预览
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    // 更新状态
    setFiles(prev => ({
      ...prev,
      [field]: { file, url: '', uploading: true, preview },
    }));

    // 上传文件
    try {
      const result = await api.uploadCertificationFile(file);

      setFiles(prev => ({
        ...prev,
        [field]: { file, url: result.url, uploading: false, preview },
      }));

      // 更新表单URL
      setForm(prev => ({
        ...prev,
        [field]: result.url,
      }));

      showToast('文件上传成功');
    } catch (err: any) {
      setFiles(prev => ({
        ...prev,
        [field]: { file: null, url: '', uploading: false, preview: undefined },
      }));
      showToast(err.message || '上传失败');
    }
  };

  // 清除已选文件
  const handleFileClear = (field: keyof typeof files) => {
    const currentFile = files[field];
    if (currentFile.preview) {
      URL.revokeObjectURL(currentFile.preview);
    }
    setFiles(prev => ({
      ...prev,
      [field]: { file: null, url: '', uploading: false, preview: undefined },
    }));
    setForm(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填文件
    if (!form.businessLicense || !form.legalIdCardFront || !form.legalIdCardBack) {
      showToast('请上传所有必填的资质文件');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/certifications', form);
      showToast('认证申请已提交，请等待审核');
      setStatus('pending');
      loadCertification();
    } catch (err: any) {
      showToast(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染文件上传区域
  const renderFileUpload = (
    field: keyof typeof files,
    label: string,
    required: boolean = false
  ) => {
    const fileState = files[field];
    const isUploading = fileState.uploading;
    const hasFile = fileState.file || fileState.url;
    const isImage = fileState.preview || (fileState.file?.type.startsWith('image/'));

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {hasFile ? (
          <div className="relative border-2 border-solid border-blue-300 rounded-lg p-2 bg-blue-50">
            {/* 文件预览 */}
            <div className="flex items-center gap-3">
              {isImage && fileState.preview ? (
                <img
                  src={fileState.preview}
                  alt={label}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  {fileState.file?.type === 'application/pdf' ? (
                    <File className="w-8 h-8 text-red-500" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {fileState.file?.name || '已上传'}
                </p>
                <p className="text-xs text-gray-500">
                  {isUploading ? '上传中...' : '点击重新选择'}
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => handleFileClear(field)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* 重新选择 */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => handleFileSelect(field, e)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
        ) : (
          <div className="relative">
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
            }`}>
              {isUploading ? (
                <div className="animate-pulse">
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-500">上传中...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">点击上传</p>
                  <p className="text-xs text-gray-400 mt-1">JPG/PNG/PDF，最大5MB</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => handleFileSelect(field, e)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
        )}
      </div>
    );
  };

  // 加载中
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  // 待审核状态
  if (status === 'pending') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">认证审核中</h3>
            <p className="text-gray-500 mb-6">您的认证申请正在审核中，请耐心等待</p>
            <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
              <p><strong>公司名称：</strong>{certInfo?.companyName}</p>
              <p><strong>提交时间：</strong>{new Date(certInfo?.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 已通过状态
  if (status === 'approved') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">认证已通过</h3>
            <p className="text-gray-500 mb-6">您的企业认证已通过审核，可以正常交易</p>
            <div className="bg-green-50 p-4 rounded-lg text-left text-sm">
              <p><strong>公司名称：</strong>{certInfo?.companyName}</p>
              <p><strong>审核时间：</strong>{new Date(certInfo?.reviewedAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 已拒绝状态
  if (status === 'rejected') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">认证未通过</h3>
            <p className="text-gray-500 mb-2">审核结果：未通过</p>
            <div className="bg-red-50 p-4 rounded-lg text-left text-sm mb-6">
              <p className="text-red-600"><strong>原因：</strong>{certInfo?.rejectReason}</p>
            </div>
            <button
              onClick={() => setStatus('none')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              重新提交
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 申请表单
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg">企业实名认证</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-blue-50 p-3 rounded-lg mb-6 text-sm text-blue-800 flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>完成企业认证后，您将可以进行正常交易。请确保填写信息真实有效，身份证号将加密存储。</span>
          </div>

          {/* 企业信息 */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 企业信息
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名称 *</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="请输入营业执照上的公司名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码 *</label>
                <input
                  type="text"
                  required
                  value={form.creditCode}
                  onChange={e => setForm({ ...form, creditCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="18位信用代码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">法定代表人 *</label>
                <input
                  type="text"
                  required
                  value={form.legalPerson}
                  onChange={e => setForm({ ...form, legalPerson: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="法人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">法人身份证号 *</label>
                <input
                  type="text"
                  required
                  value={form.legalIdCard}
                  onChange={e => setForm({ ...form, legalIdCard: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="法人身份证号（加密存储）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel"
                  required
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="企业联系电话"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="企业邮箱（选填）"
                />
              </div>
            </div>
          </div>

          {/* 资质文件 */}
          <div className="space-y-4 mt-6">
            <h4 className="font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 资质文件
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {renderFileUpload('businessLicense', '营业执照', true)}
              {renderFileUpload('legalIdCardFront', '法人身份证正面', true)}
              {renderFileUpload('legalIdCardBack', '法人身份证背面', true)}
              {renderFileUpload('bankAccountLicense', '开户许可证', false)}
            </div>

            <p className="text-xs text-gray-400">支持 JPG、PNG、PDF 格式，单个文件不超过 5MB</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交认证'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
