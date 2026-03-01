// src/components/ApprovalHistory.jsx
import React from 'react';

const ApprovalHistory = ({ approvals }) => {
    if (!approvals || approvals.length === 0) return null;

    return (
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 sm:p-8 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                История согласований
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-2">
                {approvals.map((approval, index) => (
                    <div key={index} className="ml-8 relative group">
                        {/* Dot */}
                        <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-slate-50 shadow-sm transform translate-y-0.5 transition-transform group-hover:scale-110 ${approval.decision === 'APPROVED' ? 'bg-emerald-500' :
                                approval.decision === 'SUBMITTED' ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}></div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                            <div>
                                <h4 className={`text-base font-bold mb-1 ${approval.decision === 'APPROVED' ? 'text-emerald-700' :
                                        approval.decision === 'SUBMITTED' ? 'text-indigo-700' : 'text-rose-700'
                                    }`}>
                                    {approval.decision === 'APPROVED' ? 'Одобрено' :
                                        approval.decision === 'SUBMITTED' ? 'Отправлено на проверку' : 'Отклонено'}
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {approval.userFullName}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="uppercase text-[10px] font-bold tracking-wider text-slate-400">
                                        {approval.roleAtTimeOfApproval === 'FOREMAN' ? 'Прораб' :
                                            approval.roleAtTimeOfApproval === 'PM' ? 'Project Manager' :
                                                approval.roleAtTimeOfApproval}
                                    </span>
                                </div>

                                {approval.comment && (
                                    <div className={`mt-3 text-sm p-4 rounded-xl border ${approval.decision === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-800' :
                                            approval.decision === 'SUBMITTED' ? 'bg-indigo-50/50 border-indigo-100/50 text-indigo-800' :
                                                'bg-rose-50/50 border-rose-100/50 text-rose-800'
                                        }`}>
                                        <span className="block text-[10px] font-bold opacity-60 uppercase mb-1">Комментарий:</span>
                                        "{approval.comment}"
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 whitespace-nowrap">
                                {new Date(approval.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApprovalHistory;
