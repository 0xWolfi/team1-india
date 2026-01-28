"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, User, MapPin, Globe, Loader2, CheckCircle2, Upload, X, Plus, Trash2, Link as LinkIcon, Briefcase, Edit2, Github, Linkedin, Twitter, ArrowUpRight, Rocket, Zap } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";

interface SocialProfile {
    name: string;
    url: string;
}

const AVAILABLE_ROLES = ["Developer", "Marketing", "Business Development", "Designer", "Community Manager", "Founder", "Investor", "Other"];
const PREDEFINED_INTERESTS = [
    "DeFi", "NFTs", "Gaming", "DAO", "Infrastructure", "Social", "Mobile", "Zero Knowledge", "Consumer", 
    "AI", "RWAs", "Security", "Analytics", "Trading", "Governance"
];

const AVAILABILITY_OPTIONS = [
    "Open to Hack", "Looking for Co-founder", "Hiring", "Just Exploring", "Not Available"
];

const getSocialIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('github')) return <Github className="w-4 h-4" />;
    if (lower.includes('twitter') || lower.includes('x.com')) return <Twitter className="w-4 h-4" />;
    if (lower.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
    return <LinkIcon className="w-4 h-4" />;
};

export function ProfileDashboard({ initialData }: { initialData: any }) {
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
    fullName: initialData.fullName || "",
    bio: initialData.bio || "",
    // We can keep 'location' for backward compatibility or just ignore it if we fully switch.
    // Let's use city/country if available, else try to split location, else empty.
    city: initialData.city || "",
    country: initialData.country || "",
    profileImage: initialData.profileImage || "",
    roles: (initialData.roles as string[]) || [],
    interests: (initialData.interests as string[]) || [],
    skills: (initialData.skills as string[]) || [],
    currentProject: initialData.currentProject || "",
    availability: initialData.availability || "Just Exploring",
    socialProfiles: parseSocials(initialData.socialProfiles)
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Country List State
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  // New Inputs State
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newSocial, setNewSocial] = useState({ name: "", url: "" });

  useEffect(() => {
      // Fetch countries on mount
      const fetchCountries = async () => {
          setLoadingCountries(true);
          try {
              const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2");
              if (!res.ok) throw new Error("Failed to fetch countries");
              const data = await res.json();
              const countryNames = data.map((c: any) => c.name.common).sort();
              setCountries(countryNames);
          } catch (error) {
              console.warn("Country API unavailable, using fallback list.");
              setCountries(["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Singapore", "UAE"]);
          } finally {
              setLoadingCountries(false);
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
          setMessage({ type: 'error', text: "Upload failed. Please try again." });
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
      const res = await fetch("/api/public/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            location: `${formData.city}, ${formData.country}` // Update legacy location field too just in case
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.message || "Failed to save");
      }

      setMessage({ type: 'success', text: "Profile updated successfully!" });
      router.refresh(); 
      setIsEditing(false); 
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile. Please try again.";
      console.error("Save error:", error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // --- VIEW MODE ---
  if (!isEditing) {
      return (
          <div className="max-w-4xl mx-auto py-10 pb-32 animate-in fade-in duration-500">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                   {/* Profile Image - Square/Straight as requested */}
                   <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                       {formData.profileImage ? (
                           <Image src={formData.profileImage} alt={formData.fullName || "User"} fill className="object-cover" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center">
                               <User className="w-10 h-10 text-zinc-700" />
                           </div>
                       )}
                   </div>

                   <div className="flex-1 space-y-4">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                               <h1 className="text-3xl font-bold text-white tracking-tight">{formData.fullName || "New Builder"}</h1>
                               <div className="flex flex-wrap items-center gap-3 mt-2 text-zinc-500 text-sm">
                                   {(formData.city || formData.country) && (
                                       <div className="flex items-center gap-1.5">
                                           <MapPin className="w-4 h-4" />
                                           <span>
                                               {formData.city && formData.country 
                                                    ? `${formData.city}, ${formData.country}`
                                                    : formData.city || formData.country
                                                }
                                           </span>
                                       </div>
                                   )}
                                   {formData.availability && (
                                       <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs">
                                           {formData.availability}
                                       </span>
                                   )}
                               </div>
                           </div>
                           
                           <button 
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors rounded-md flex items-center gap-2"
                           >
                               <Edit2 className="w-3.5 h-3.5" />
                               Edit Profile
                           </button>
                       </div>
                       
                       <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
                           {formData.bio || "No bio yet."}
                       </p>

                       {/* Socials - Simple List */}
                       <div className="flex flex-wrap gap-3 pt-2">
                           {formData.socialProfiles.map((social, i) => (
                               <a 
                                  key={i} 
                                  href={social.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-white transition-colors"
                                  title={social.name}
                               >
                                   {getSocialIcon(social.name)}
                               </a>
                           ))}
                       </div>
                   </div>
              </div>

              <div className="mt-12 space-y-12">
                  {/* Current Project */}
                  <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Current Project</h3>
                      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
                          <p className="text-zinc-300">
                              {formData.currentProject || "Not working on anything public right now."}
                          </p>
                      </div>
                  </section>

                  {/* Skills & Roles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="space-y-3">
                          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                              {formData.skills.length > 0 ? formData.skills.map(skill => (
                                  <span key={skill} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded">
                                      {skill}
                                  </span>
                              )) : <span className="text-zinc-600 text-sm italic">No skills listed</span>}
                          </div>
                      </section>

                      <section className="space-y-3">
                          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Roles</h3>
                          <div className="flex flex-wrap gap-2">
                              {formData.roles.length > 0 ? formData.roles.map(role => (
                                  <span key={role} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded">
                                      {role}
                                  </span>
                              )) : <span className="text-zinc-600 text-sm italic">--</span>}
                          </div>
                      </section>
                  </div>

                  {/* Interests */}
                  <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                          {formData.interests.length > 0 ? formData.interests.map(item => (
                              <span key={item} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm rounded transition-colors cursor-default">
                                  {item}
                              </span>
                          )) : <span className="text-zinc-600 italic text-sm">No interests selected</span>}
                      </div>
                  </section>
              </div>
          </div>
      );
  }

  // --- EDIT MODE ---
  return (
    <div className="max-w-4xl mx-auto py-10 pb-32 animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Header Editor */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <div className="flex flex-col items-center gap-3">
            {/* Square/Straight Profile Picture Box */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group">
                {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                ) : (
                    <>
                        {formData.profileImage ? (
                            <Image src={formData.profileImage} alt="Profile" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-12 h-12 text-zinc-700" />
                            </div>
                        )}
                        <div 
                            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-6 h-6 text-white mb-1" />
                            <span className="text-[10px] uppercase font-bold text-zinc-300">Change</span>
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
                    <Trash2 className="w-3 h-3" /> Remove
                </button>
            )}
        </div>

        <div className="flex-1 space-y-5 w-full">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Full Name</label>
                <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Your Name"
                    className="w-full text-2xl font-bold text-white bg-transparent border-b border-zinc-800 rounded-none px-2 py-2 focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
                />
            </div>
            
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Bio</label>
                <textarea 
                    value={formData.bio} 
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={3}
                    placeholder="Short bio..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-zinc-600 transition-all resize-none text-sm leading-relaxed"
                />
            </div>
        </div>

        {/* Buttons - Sleek & Better Positioned */}
        <div className="flex flex-col gap-3 min-w-[120px]">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-white text-black text-sm font-bold rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
            </button>
            <button
                onClick={() => setIsEditing(false)}
                className="w-full px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-md hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                Cancel
            </button>
            {message && (
                <div className={`mt-2 text-[10px] font-bold text-center ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {message.text}
                </div>
            )}
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
                               <button onClick={() => removeSkill(skill)} className="text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>
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
                   <h3 className="text-lg font-bold text-white">Social Links</h3>
                   <div className="space-y-3">
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
                                   <Trash2 className="w-4 h-4" />
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
                                    <Plus className="w-4 h-4" />
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
                           <Plus className="w-3 h-3" />
                       </button>
                   </div>
              </section>
          </div>
      </div>
    </div>
  );
}
