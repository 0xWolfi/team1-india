import React from 'react';
import { Mail, Calendar, Newspaper, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Contact Us">
            <div className="grid gap-4">
                <Link href="mailto:partners@team1india.com" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group border border-white/5">
                    <div className="p-3 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-zinc-200 transition-colors">Partnerships</div>
                        <div className="text-sm text-zinc-500">Collaborate with us</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-white" />
                </Link>

                <Link href="#" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group border border-white/5">
                    <div className="p-3 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-zinc-200 transition-colors">Events Team</div>
                        <div className="text-sm text-zinc-500">Host or sponsor events</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-white" />
                </Link>

                <Link href="#" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group border border-white/5">
                    <div className="p-3 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <Newspaper className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-zinc-200 transition-colors">Press Inquiries</div>
                        <div className="text-sm text-zinc-500">Media and coverage</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-white" />
                </Link>
            </div>
        </Modal>
    );
}
