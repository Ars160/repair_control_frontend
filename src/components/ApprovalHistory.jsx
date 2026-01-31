// src/components/ApprovalHistory.jsx
import React from 'react';

const ApprovalHistory = ({ approvals }) => {
    if (!approvals || approvals.length === 0) return null;

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest pl-1 mb-4">История согласований</h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {approvals.map((approval, index) => (
                    <div key={index} className="ml-6 relative">
                        {/* Dot */}
                        <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm transform translate-y-0.5 ${approval.decision === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">
                                    {approval.decision === 'APPROVED' ? 'Одобрено' : 'Отклонено'}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    {approval.userFullName} <span className="text-slate-300 mx-1">•</span>
                                    <span className="uppercase text-[9px] tracking-wider text-slate-400">
                                        {approval.roleAtTimeOfApproval === 'FOREMAN' ? 'Прораб' :
                                            approval.roleAtTimeOfApproval === 'PM' ? 'Project Manager' :
                                                approval.roleAtTimeOfApproval}
                                    </span>
                                </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono pt-0.5">
                                {new Date(approval.createdAt).toLocaleString()}
                            </span>
                        </div>

                        {approval.comment && (
                            <div className={`mt-2 text-xs p-3 rounded-lg border ${approval.decision === 'APPROVED'
                                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                                : 'bg-red-50/50 border-red-100 text-red-800'
                                }`}>
                                {approval.comment}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApprovalHistory;
