'use client';

import { FormEvent, useState } from 'react';
import { Check, Contact, ImagePlus, MapPin, Phone, Plus, Save, Trash2, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { FamilyMember } from '@/types';
import styles from './page.module.css';

export default function CaregiverPatientsPage() {
  const { currentPatient, patientDetails, setPatientDetails, familyMembers, setFamilyMembers } = useApp();
  const [address, setAddress] = useState(patientDetails.address);
  const [phone, setPhone] = useState(patientDetails.phone);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ name: '', relationship: '', image_url: '' });

  function saveDetails(event: FormEvent) {
    event.preventDefault();
    setPatientDetails({ patient_id: currentPatient?.id || 'demo-patient', address, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function addFamilyMember(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const member: FamilyMember = { id: crypto.randomUUID(), name: draft.name.trim(), relationship: draft.relationship.trim() || 'Family', image_url: draft.image_url.trim() };
    setFamilyMembers([...familyMembers, member]);
    setDraft({ name: '', relationship: '', image_url: '' });
  }

  return <div className={styles.page}>
    <div className={styles.hero}><div className={styles.avatar}><UserRound size={32} /></div><div><span className={styles.kicker}>Patient profile</span><h2>{currentPatient?.display_name || 'Patient'}</h2><p>Keep the patient’s trusted people and emergency details close at hand.</p></div></div>
    <div className={styles.grid}>
      <form className={styles.card} onSubmit={saveDetails}><h3><Contact size={20} /> Contact details</h3><label><MapPin size={17} /> Home address<textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House, street, town" rows={4} /></label><label><Phone size={17} /> Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="+91 98765 43210" /></label><button className={styles.primaryButton} type="submit"><Save size={18} /> {saved ? 'Saved' : 'Save details'}</button></form>
      <section className={styles.card}><div className={styles.cardHeader}><div><h3><ImagePlus size={20} /> Family memory quiz</h3><p>Add names and photos. The patient will see these as a gentle recognition game.</p></div><span className={styles.memberCount}>{familyMembers.length}</span></div><form className={styles.addForm} onSubmit={addFamilyMember}><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" required /><input value={draft.relationship} onChange={(event) => setDraft({ ...draft, relationship: event.target.value })} placeholder="Relationship" /><input value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="Photo URL (optional)" /><button className={styles.addButton} type="submit" aria-label="Add family member"><Plus size={21} /></button></form><div className={styles.familyList}>{familyMembers.length === 0 ? <div className={styles.empty}><ImagePlus size={28} /> No family members added yet.</div> : familyMembers.map((member) => <div className={styles.familyItem} key={member.id}>{member.image_url ? <img src={member.image_url} alt="" /> : <div className={styles.photoPlaceholder}><UserRound size={22} /></div>}<div><strong>{member.name}</strong><span>{member.relationship}</span></div><button className={styles.deleteButton} onClick={() => setFamilyMembers(familyMembers.filter((item) => item.id !== member.id))} aria-label={`Remove ${member.name}`}><Trash2 size={17} /></button></div>)}</div></section>
    </div>
    {saved && <div className={styles.savedNotice}><Check size={18} /> Patient details saved</div>}
  </div>;
}
