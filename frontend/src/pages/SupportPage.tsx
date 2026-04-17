import React from 'react';
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from 'lucide-react';

export const SupportPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-10">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">Help & Support</h2>
        <p className="text-white/65 font-medium">Resources and assistance for your academic sanctuary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10 flex flex-col gap-6">
            <div className="w-12 h-12 bg-blue-500/15 text-blue-300 rounded-2xl flex items-center justify-center">
               <Book size={24} />
            </div>
            <div>
               <h3 className="font-bold text-xl text-white">Knowledge Base</h3>
               <p className="text-sm text-white/60 mt-2 leading-relaxed">Learn how to import students, configure coefficients, and manage evaluations effectively.</p>
            </div>
            <button className="flex items-center gap-2 text-terra-light font-bold text-sm hover:underline">
               Read Documentation <ExternalLink size={14} />
            </button>
         </div>

         <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/10 flex flex-col gap-6">
            <div className="w-12 h-12 bg-emerald-500/15 text-emerald-300 rounded-2xl flex items-center justify-center">
               <MessageCircle size={24} />
            </div>
            <div>
               <h3 className="font-bold text-xl text-white">Community Support</h3>
               <p className="text-sm text-white/60 mt-2 leading-relaxed">Connect with other educators using EvalTrack and share best practices for grading.</p>
            </div>
            <button className="flex items-center gap-2 text-terra-light font-bold text-sm hover:underline">
               Join Discussion <ExternalLink size={14} />
            </button>
         </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border border-white/10 flex flex-col items-center text-center gap-6">
         <div className="p-4 bg-white/10 rounded-full text-white backdrop-blur-xl">
            <HelpCircle size={48} />
         </div>
         <div className="max-w-md">
            <h3 className="text-2xl font-bold text-white mb-2">Need direct assistance?</h3>
            <p className="text-white/60 text-sm">Our academic support team is available to help you with technical issues or configuration questions.</p>
         </div>
         <button className="flex items-center gap-3 bg-white text-slate-900 px-10 py-4 rounded-full font-bold shadow-xl hover:bg-slate-100 transition-all active:scale-95">
            <Mail size={18} /> Contact Support
         </button>
      </div>
    </div>
  );
};
