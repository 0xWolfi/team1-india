"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Award, Briefcase, Calendar, Edit2, FileText, Github, Link, Linkedin, Loader2, MapPin, MessageCircle, Plus, Save, Send, Trash2, Trophy, Twitter, Upload, User, Video, Wallet, X, Zap } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";

interface SocialProfile {
    name: string;
    url: string;
}

interface ProfileDashboardProps {
    initialData: any;
    role?: 'PUBLIC' | 'MEMBER' | 'CORE';
}

const AVAILABLE_ROLES = ["Developer", "Marketing", "Business Development", "Designer", "Community Manager", "Founder", "Investor", "Other"];
const PREDEFINED_INTERESTS = [
    "DeFi", "NFTs", "Gaming", "DAO", "Infrastructure", "Social", "Mobile", "Zero Knowledge", "Consumer", 
    "AI", "RWAs", "Security", "Analytics", "Trading", "Governance"
];

const AVAILABILITY_OPTIONS = [
    "Open to Hack", "Looking for Co-founder", "Hiring", "Just Exploring", "Not Available"
];

// Data will be fetched from API
const EVENTS: any[] = [];
const POAPS: any[] = [];
const CONTENT: any[] = [];
const ACHIEVEMENTS: any[] = [];

const getSocialIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('github')) return <Github className="w-4 h-4"/>;
    if (lower.includes('twitter') || lower.includes('x.com')) return <Twitter className="w-4 h-4"/>;
    if (lower.includes('linkedin')) return <Linkedin className="w-4 h-4"/>;
    return <Link className="w-4 h-4"/>;
};

export function ProfileDashboard({ initialData, role = 'PUBLIC' }: ProfileDashboardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSocials = (socials: any): SocialProfile[] => {
      if (Array.isArray(socials)) return socials;
      if (typeof socials === 'object' && socials !== null) {
          return Object.entries(socials).map(([key, value]) => ({ name: key, url: String(value) })).filter(s => s.url);
      }
      return [];
  };

  const [formData, setFormData] = useState({
    fullName: initialData.fullName || initialData.name || "",
    bio: initialData.bio || "",
    city: initialData.city || "",
    country: initialData.country || "",
    profileImage: initialData.profileImage || initialData.image || "",
    roles: (initialData.roles as string[]) || [],
    interests: (initialData.interests as string[]) || [],
    skills: (initialData.skills as string[]) || [],
    currentProject: initialData.currentProject || "",
    availability: initialData.availability || "Just Exploring",
    socialProfiles: parseSocials(initialData.socialProfiles),
    // Extra fields for Member/Core parity
    xHandle: initialData.xHandle || "",
    telegram: initialData.telegram || "",
    wallet: initialData.wallet || initialData.customFields?.wallet || "",
    discord: initialData.discord || initialData.customFields?.discord || ""
  });
  
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Country List State
  const [countries, setCountries] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newSocial, setNewSocial] = useState({ name: "", url: "" });

  useEffect(() => {
      const fetchCountries = async () => {
          try {
              const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2");
              if (!res.ok) throw new Error("Failed to fetch countries");
              const data = await res.json();
              const countryNames = data.map((c: any) => c.name.common).sort();
              setCountries(countryNames);
          } catch (error) {
              setCountries(["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Singapore", "UAE"]);
          }
      };
      fetchCountries();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Image Upload ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload/token',
          });
          
          setFormData(prev => ({ ...prev, profileImage: newBlob.url }));
          setMessage({ type: 'success', text: "Image uploaded! Save to persist." });
      } catch (error) {
          console.error("Upload failed", error);
          setMessage({ type: 'error', text: "Upload failed." });
      } finally {
          setIsUploading(false);
      }
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({ ...prev, profileImage: "" }));
  };

  // --- Dynamic Lists ---
  const addSocial = () => {
      if (!newSocial.name || !newSocial.url) return;
      setFormData(prev => ({
          ...prev,
          socialProfiles: [...prev.socialProfiles, { ...newSocial }]
      }));
      setNewSocial({ name: "", url: "" });
  };
  const removeSocial = (index: number) => {
      setFormData(prev => ({
          ...prev,
          socialProfiles: prev.socialProfiles.filter((_, i) => i !== index)
      }));
  };

  const addSkill = (e?: React.KeyboardEvent) => {
      if (e && e.key !== 'Enter' && e.key !== ',') return;
      if (e) e.preventDefault();
      
      const skill = newSkill.trim();
      if (!skill) return;
      if (formData.skills.includes(skill)) {
          setNewSkill("");
          return;
      }
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setNewSkill("");
  };
  const removeSkill = (skill: string) => {
      setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addInterest = (custom?: string) => {
      const interest = custom || newInterest.trim();
      if (!interest) return;
      if (formData.interests.length >= 10) return alert("Maximum 10 interests allowed.");
      if (formData.interests.includes(interest)) return;

      setFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
      if (!custom) setNewInterest("");
  };
  const removeInterest = (interest: string) => {
      setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const toggleRole = (role: string) => {
      setFormData(prev => {
          if (prev.roles.includes(role)) {
              return { ...prev, roles: prev.roles.filter(r => r !== role) };
          } else {
              if (prev.roles.length >= 3) return prev;
              return { ...prev, roles: [...prev.roles, role] };
          }
      });
  };

  // --- Save ---
  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // Determine endpoint based on role/context logic or stick to public prop for now
      // Since this is unifying, we might need a dynamic endpoint. 
      // For now we default to public profile update, but in real unified app, this should adapt.
      const endpoint = role === 'MEMBER' || role === 'CORE' ? "/api/profile" : "/api/public/profile";
      
      // Member/Core usually patch specific fields. 
      // For this implementation, we simulate success for demo or map correctly.
      
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            name: formData.fullName, // Map back for member/core
            customFields: { // Map for member/core
                wallet: formData.wallet,
                discord: formData.discord,
                bio: formData.bio
            },
            location: `${formData.city}, ${formData.country}`
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setMessage({ type: 'success', text: "Profile updated successfully!" });
      router.refresh(); 
      setIsEditing(false); 
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: 'error', text: "Failed to save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  // --- VIEW MODE ---
  if (!isEditing) {
      return (
          <div className="max-w-4xl mx-auto py-10 pb-32 animate-in fade-in duration-500">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                   {/* Profile Image */}
                   <div className="relative w-32 h-32 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                       {formData.profileImage ? (
                           <Image src={formData.profileImage} alt={formData.fullName || "User"} fill className="object-cover" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center">
                               <User className="w-12 h-12 text-zinc-700"/>
                           </div>
                       )}
                   </div>

                   <div className="flex-1 w-full space-y-4">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                           <div className="space-y-2">
                               <div className="flex items-center gap-3">
                                   <h1 className="text-4xl font-bold text-white tracking-tight">{formData.fullName || "New Builder"}</h1>
                                   <span className={cn(
                                       "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                       role === 'CORE' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                       role === 'MEMBER' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                       "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                   )}>
                                       {role}
                                   </span>
                               </div>
                               
                               <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm">
                                   {(formData.city || formData.country) && (
                                       <div className="flex items-center gap-1.5">
                                           <MapPin className="w-3.5 h-3.5"/>
                                           <span>{formData.city}{formData.city && formData.country ? ", " : ""}{formData.country}</span>
                                       </div>
                                   )}
                                   {formData.xHandle && (
                                       <div className="flex items-center gap-1.5 text-zinc-500">
                                            <Twitter className="w-3.5 h-3.5"/>
                                            <span>{formData.xHandle}</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                           
                           <button 
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors rounded-lg flex items-center gap-2"
                           >
                               <Edit2 className="w-3.5 h-3.5"/>
                               Edit Profile
                           </button>
                       </div>
                       
                       <p className="text-zinc-300 text-base leading-relaxed max-w-2xl">
                           {formData.bio || "No bio provided."}
                       </p>

                       {/* Socials & Availability */}
                       <div className="flex flex-wrap items-center gap-4 pt-2">
                           {formData.availability && (
                               <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                                   {formData.availability}
                               </span>
                           )}
                           <div className="h-4 w-px bg-zinc-800 hidden md:block" />
                           <div className="flex gap-3">
                               {formData.socialProfiles.map((social, i) => (
                                   <a key={i} href={social.url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                       {getSocialIcon(social.name)}
                                   </a>
                               ))}
                               {formData.wallet && (
                                   <div title="Wallet Connected" className="text-zinc-500 hover:text-white cursor-help">
                                       <Wallet className="w-4 h-4"/>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
                  {["OVERVIEW", "EVENTS", "CONTENT", "ACHIEVEMENTS"].map((tab) => (
                      <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                              "px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                              activeTab === tab 
                                  ? "border-white text-white" 
                                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                          )}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                  {activeTab === "OVERVIEW" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Left Col */}
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Current Project</h3>
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Briefcase className="w-5 h-5 text-zinc-400 mt-0.5"/>
                                        <p className="text-zinc-300 font-medium">
                                            {formData.currentProject || "Not working on anything public right now."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills.length > 0 ? formData.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg">
                                            {skill}
                                        </span>
                                    )) : <span className="text-zinc-600 italic">No skills listed</span>}
                                </div>
                            </section>

                             <section>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {formData.interests.length > 0 ? formData.interests.map(item => (
                                        <span key={item} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm rounded-lg">
                                            {item}
                                        </span>
                                    )) : <span className="text-zinc-600 italic">No interests selected</span>}
                                </div>
                            </section>
                        </div>

                        {/* Right Col */}
                        <div className="space-y-8">
                            {/* XP Stats */}
                            {(role === 'MEMBER' || role === 'CORE') && initialData.totalXp !== undefined && (
                                <section className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <Zap className="w-4 h-4 text-amber-400"/>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white tabular-nums">{initialData.totalXp || 0}</p>
                                            <p className="text-[11px] text-zinc-500 font-medium">Total XP Earned</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Roles</h3>
                                <div className="flex flex-wrap gap-2">
                                    {formData.roles.length > 0 ? formData.roles.map(role => (
                                        <span key={role} className="px-3 py-1.5 bg-white/5 border border-white/5 text-white text-sm font-medium rounded-lg">
                                            {role}
                                        </span>
                                    )) : <span className="text-zinc-600 italic">--</span>}
                                </div>
                            </section>

                            {/* Contact Card (Simulated based on viewable fields) */}
                            <section className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-4">
                                <h3 className="text-sm font-bold text-white mb-2">Contact</h3>
                                {formData.telegram && (
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <Send className="w-4 h-4"/>
                                        <span>{formData.telegram}</span>
                                    </div>
                                )}
                                {formData.discord && (
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <MessageCircle className="w-4 h-4"/>
                                        <span>{formData.discord}</span>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                  )}

                  {activeTab === "EVENTS" && (
                      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          {/* Event Timeline / List */}
                          <section>
                              <div className="flex items-center justify-between mb-6">
                                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                      <Calendar className="w-5 h-5 text-zinc-100"/>
                                      Events Attended
                                  </h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {EVENTS.length > 0 ? EVENTS.map(event => (
                                      <div key={event.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all hover:scale-[1.02] duration-300">
                                          <div className="relative h-32 w-full">
                                              <Image src={event.image} alt={event.name} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-bold text-white border border-white/10">
                                                  {event.status}
                                              </div>
                                          </div>
                                          <div className="p-4">
                                              <h4 className="text-base font-bold text-white mb-1">{event.name}</h4>
                                              <div className="flex justify-between items-center text-xs text-zinc-500">
                                                  <span>{event.date}</span>
                                                  <span className="text-zinc-300 font-medium">{event.role}</span>
                                              </div>
                                          </div>
                                      </div>
                                  )) : (
                                      <div className="col-span-full flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                                          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                                              <Calendar className="w-8 h-8 text-zinc-600"/>
                                          </div>
                                          <h3 className="text-lg font-bold text-white mb-2">No Events Yet</h3>
                                          <p className="text-zinc-500 text-center max-w-sm">
                                              Join our upcoming hackathons and community meetups to start building your timeline!
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </section>
                          
                          {/* POAPs */}
                          <section>
                               <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                  <Award className="w-5 h-5 text-zinc-100"/>
                                  POAPs & Collectibles
                               </h3>
                               <div className="flex flex-wrap gap-4">
                                   {POAPS.length > 0 ? POAPS.map(poap => (
                                       <div key={poap.id} className="w-24 h-24 relative rounded-full border-2 border-zinc-800 bg-zinc-900 p-1 group hover:border-purple-500/50 transition-colors" title={poap.name}>
                                           <div className="w-full h-full relative rounded-full overflow-hidden">
                                                <Image src={poap.image} alt={poap.name} fill className="object-cover" />
                                           </div>
                                       </div>
                                   )) : (
                                       <div className="w-full flex items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                             <div className="w-10 h-10 bg-zinc-800/50 rounded-full flex items-center justify-center">
                                                  <Award className="w-5 h-5 text-zinc-400"/>
                                             </div>
                                             <div className="flex-1">
                                                 <p className="text-sm text-zinc-400">No collectibles yet. Attend events to earn POAPs!</p>
                                             </div>
                                       </div>
                                   )}
                               </div>
                          </section>
                      </div>
                  )}

                  {activeTab === "CONTENT" && (
                       <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <FileText className="w-5 h-5 text-zinc-100"/>
                                Content Contributions
                            </h3>
                            <div className="space-y-4">
                                {CONTENT.length > 0 ? CONTENT.map(content => (
                                    <div key={content.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-zinc-800 rounded-lg">
                                                {content.type === "Video" ? <Video className="w-5 h-5 text-white"/> : <FileText className="w-5 h-5 text-white"/>}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-white mb-1 hover:underline cursor-pointer">{content.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{content.type}</span>
                                                    <span>{content.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold border self-start md:self-center",
                                            content.status === "Accepted" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                        )}>
                                            {content.status}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-zinc-600"/>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No Content Yet</h3>
                                        <p className="text-zinc-500 text-center max-w-sm">
                                            Share your knowledge! Submit articles, videos, or guides to earn reputation.
                                        </p>
                                    </div>
                                )}
                            </div>
                       </div>
                  )}

                  {activeTab === "ACHIEVEMENTS" && (
                       <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <Trophy className="w-5 h-5 text-zinc-100"/>
                                Badges & Achievements
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {ACHIEVEMENTS.length > 0 ? ACHIEVEMENTS.map(badge => (
                                    <div key={badge.id} className="flex flex-col items-center text-center p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center mb-4 shadow-lg">
                                            {badge.icon}
                                        </div>
                                        <h4 className="text-sm font-bold text-white mb-1">{badge.name}</h4>
                                        <p className="text-xs text-zinc-500">{badge.description}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                                            <Trophy className="w-8 h-8 text-zinc-600"/>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No Achievements Yet</h3>
                                        <p className="text-zinc-500 text-center max-w-sm">
                                            Contributions tracked on-chain will appear here as badges.
                                        </p>
                                    </div>
                                )}
                            </div>
                       </div>
                  )}
              </div>
          </div>
      );
  }

  // --- EDIT MODE ---
  return (
    <div className="max-w-4xl mx-auto py-10 pb-32 animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Header Editor */}
      <h2 className="text-2xl font-bold text-white mb-8">Edit Profile</h2>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <div className="flex flex-col items-center gap-3">
            {/* Square/Straight Profile Picture Box */}
            <div className="relative w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group shadow-xl">
                {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin"/>
                    </div>
                ) : (
                    <>
                        {formData.profileImage ? (
                            <Image src={formData.profileImage} alt="Profile" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-12 h-12 text-zinc-700"/>
                            </div>
                        )}
                        <div 
                            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 text-white mb-2"/>
                            <span className="text-xs uppercase font-bold text-zinc-300">Change</span>
                        </div>
                    </>
                )}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload} 
            />
            {formData.profileImage && (
                <button onClick={handleRemoveImage} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-medium">
                    <Trash2 className="w-3 h-3"/> Remove
                </button>
            )}
        </div>

        <div className="flex-1 space-y-5 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.fullName} 
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="Your Name"
                        className="w-full text-base font-bold text-white bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
                    />
                </div>
                <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">X Handle</label>
                     <div className="relative">
                        <Twitter className="absolute left-3 top-3 w-4 h-4 text-zinc-500"/>
                        <input 
                            type="text"
                            value={formData.xHandle}
                            onChange={(e) => handleChange('xHandle', e.target.value)}
                            placeholder="@username"
                            className="w-full text-base text-zinc-200 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
                        />
                     </div>
                </div>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Bio</label>
                <textarea 
                    value={formData.bio} 
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={3}
                    placeholder="Short bio..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-white transition-all resize-none text-sm leading-relaxed"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Professional */}
          <div className="space-y-8">
               <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">Professional</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Availability</label>
                          <select 
                              value={formData.availability}
                              onChange={(e) => handleChange('availability', e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                          >
                              {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Current Project</label>
                          <input 
                              type="text" 
                              value={formData.currentProject} 
                              onChange={(e) => handleChange('currentProject', e.target.value)}
                              placeholder="e.g. Building a consumer dapp"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Country</label>
                                <select 
                                    value={formData.country} 
                                    onChange={(e) => handleChange('country', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 appearance-none"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">City</label>
                                <input 
                                    type="text" 
                                    value={formData.city} 
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="e.g. Bengaluru"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                />
                            </div>
                      </div>
                  </div>
              </section>

              <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-4">
                   <h3 className="text-lg font-bold text-white">Skills</h3>
                   <div className="flex flex-wrap gap-2 mb-2">
                       {formData.skills.map(skill => (
                           <span key={skill} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/5 text-sm font-medium flex items-center gap-2">
                               {skill}
                               <button onClick={() => removeSkill(skill)} className="text-zinc-500 hover:text-white"><X className="w-3 h-3"/></button>
                           </span>
                       ))}
                   </div>
                   <input 
                       type="text"
                       value={newSkill}
                       onChange={(e) => setNewSkill(e.target.value)}
                       onKeyDown={addSkill}
                       placeholder="+ Add Skill (Press Enter)"
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                   />
              </section>

              <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">Roles (Max 3)</h3>
                      <span className="text-xs text-zinc-500">{formData.roles.length}/3</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map(role => (
                          <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              disabled={!formData.roles.includes(role) && formData.roles.length >= 3}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  formData.roles.includes(role) 
                                      ? "bg-white text-black border-white" 
                                      : "bg-black/20 text-zinc-400 border-white/5 hover:border-white/20 disabled:opacity-30"
                              }`}
                          >
                              {role}
                          </button>
                      ))}
                  </div>
              </section>
          </div>

          {/* Right: Socials & Interests */}
          <div className="space-y-8">
              <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-4">
                   <h3 className="text-lg font-bold text-white">Contact & Socials</h3>
                   
                   {/* Wallet Field */}
                   <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Wallet Address</label>
                       <div className="relative">
                           <Wallet className="absolute left-3 top-3 w-4 h-4 text-zinc-500"/>
                           <input 
                               type="text" 
                               value={formData.wallet} 
                               onChange={(e) => handleChange('wallet', e.target.value)}
                               placeholder="0x..."
                               className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/20 font-mono text-sm"
                           />
                       </div>
                   </div>

                   {/* Telegram & Discord */}
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Telegram</label>
                           <div className="relative">
                               <Send className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500"/>
                               <input 
                                   type="text" 
                                   value={formData.telegram} 
                                   onChange={(e) => handleChange('telegram', e.target.value)}
                                   placeholder="@username"
                                   className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-white/20 text-sm"
                               />
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Discord</label>
                           <div className="relative">
                               <MessageCircle className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500"/>
                               <input 
                                   type="text" 
                                   value={formData.discord} 
                                   onChange={(e) => handleChange('discord', e.target.value)}
                                   placeholder="username"
                                   className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-white/20 text-sm"
                               />
                           </div>
                       </div>
                   </div>

                   <hr className="border-white/5 my-2" />

                   <div className="space-y-3">
                       <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Other Links</label>
                       {formData.socialProfiles.map((social, idx) => (
                           <div key={idx} className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                                   {getSocialIcon(social.name)}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="text-xs font-bold text-zinc-300 truncate">{social.name}</div>
                                   <div className="text-[10px] text-zinc-500 truncate">{social.url}</div>
                               </div>
                               <button onClick={() => removeSocial(idx)} className="p-2 text-zinc-600 hover:text-red-400">
                                   <Trash2 className="w-4 h-4"/>
                               </button>
                           </div>
                       ))}
                       <div className="pt-2 border-t border-white/5 space-y-2">
                           <input 
                               type="text"
                               value={newSocial.name}
                               onChange={(e) => setNewSocial(prev => ({ ...prev, name: e.target.value }))}
                               placeholder="Label (e.g. Portfolio)"
                               className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                           />
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newSocial.url}
                                    onChange={(e) => setNewSocial(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://..."
                                    className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                                />
                                <button onClick={addSocial} className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                                    <Plus className="w-4 h-4"/>
                                </button>
                            </div>
                       </div>
                   </div>
              </section>

               <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl space-y-4">
                   <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Interests</h3>
                        <span className="text-xs text-zinc-500">{formData.interests.length}/10</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                       {PREDEFINED_INTERESTS.map(item => (
                           <button
                               key={item}
                               onClick={() => formData.interests.includes(item) ? removeInterest(item) : addInterest(item)}
                               className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                   formData.interests.includes(item) 
                                       ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                                       : "bg-black/20 text-zinc-500 border-white/5 hover:border-white/10"
                               }`}
                           >
                               {item}
                           </button>
                       ))}
                       {formData.interests
                            .filter(i => !PREDEFINED_INTERESTS.includes(i))
                            .map(item => (
                                <button key={item} onClick={() => removeInterest(item)} className="px-2 py-1 rounded-lg text-[10px] font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20">
                                   {item}
                               </button>
                        ))}
                   </div>
                   <div className="flex gap-2">
                       <input 
                           type="text"
                           value={newInterest}
                           onChange={(e) => setNewInterest(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                           placeholder="Custom interest..."
                           className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                       />
                       <button onClick={() => addInterest()} className="px-3 bg-white/5 hover:bg-white/10 rounded-lg text-white">
                           <Plus className="w-3 h-3"/>
                       </button>
                   </div>
              </section>
          </div>
      </div>
      
      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-8 z-50">
          <p className="text-sm text-zinc-400 hidden md:block">Unsaved changes will be lost.</p>
          <div className="flex gap-3 ml-auto">
             <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors"
                  disabled={isSaving}
              >
                  Cancel
              </button>
              <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-white/5"
              >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  Save Changes
              </button>
          </div>
      </div>
    </div>
  );
}
