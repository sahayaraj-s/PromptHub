// ================================================
// PROMPTHUB - FIREBASE CONFIGURATION
// ================================================
const firebaseConfig = {
  apiKey: "AIzaSyCrGJ06-NJvZNmhuerBkMWj6sVPlJWB5qs",
  authDomain: "prompthub-426dd.firebaseapp.com",
  projectId: "prompthub-426dd",
  storageBucket: "prompthub-426dd.firebasestorage.app",
  messagingSenderId: "63608545915",
  appId: "1:63608545915:web:602231124ca75da1eef8de",
  measurementId: "G-9F1SLZJCSJ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ================================================
// CLOUDINARY CONFIG
// ================================================
const CLOUDINARY_CONFIG = {
  cloudName: "dnog9dqjp",
  uploadPreset: "prompthub",
  apiBase: "https://api.cloudinary.com/v1_1/dnog9dqjp"
};
const Cloudinary = {
  imageUrl(id, opts={}) {
    const {w=800,h=600,q='auto',f='auto'}=opts;
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${w},h_${h},c_fill,q_${q},f_${f}/${id}`;
  },
  videoUrl(id) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/q_auto/${id}`;
  },
  thumbnailUrl(id) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/w_800,h_450,c_fill,q_auto,f_jpg,so_0/${id}`;
  },
  async upload(file, onProgress) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    const isVideo = file.type.startsWith('video/');
    const ep = `${CLOUDINARY_CONFIG.apiBase}/${isVideo?'video':'image'}/upload`;
    return new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', ep);
      if (onProgress) xhr.upload.onprogress = e => { if(e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
      xhr.onload = () => xhr.status===200 ? res(JSON.parse(xhr.responseText)) : rej(new Error('Upload failed'));
      xhr.onerror = () => rej(new Error('Network error'));
      xhr.send(fd);
    });
  }
};


// ================================================
// DB HELPERS (with Category support)
// ================================================
const DB = {
  // ── PROMPTS ──
  async getPrompts({limit=12,category=null,tool=null,type=null,orderBy='createdAt'}={}) {
    let q = db.collection('prompts').where('published','==',true);
    if(category) q=q.where('category','==',category);
    if(tool) q=q.where('tool','==',tool);
    if(type) q=q.where('type','==',type);
    q=q.orderBy(orderBy,'desc').limit(limit);
    const s=await q.get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  },
  async getTrending(limit=6) {
    const s=await db.collection('prompts').where('published','==',true).orderBy('likes','desc').limit(limit).get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  },
  async getPrompt(id) {
    const d=await db.collection('prompts').doc(id).get();
    return d.exists?{id:d.id,...d.data()}:null;
  },
  async createPrompt(data) {
    return await db.collection('prompts').add({...data,likes:0,views:0,copies:0,saves:0,comments:0,published:true,featured:false,pinned:false,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  },
  async updatePrompt(id,data) {
    await db.collection('prompts').doc(id).update({...data,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  },
  async deletePrompt(id) { await db.collection('prompts').doc(id).delete(); },
  async incrementField(col,id,field,val=1) {
    await db.collection(col).doc(id).update({[field]:firebase.firestore.FieldValue.increment(val)});
  },
  async toggleLike(promptId,userId) {
    const ref=db.collection('likes').doc(`${userId}_${promptId}`);
    const doc=await ref.get();
    if(doc.exists){await ref.delete();await this.incrementField('prompts',promptId,'likes',-1);return false;}
    await ref.set({userId,promptId,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    await this.incrementField('prompts',promptId,'likes',1);return true;
  },
  async isLiked(promptId,userId) { return (await db.collection('likes').doc(`${userId}_${promptId}`).get()).exists; },
  async toggleSave(promptId,userId) {
    const ref=db.collection('saved').doc(`${userId}_${promptId}`);
    const doc=await ref.get();
    if(doc.exists){await ref.delete();await this.incrementField('prompts',promptId,'saves',-1);return false;}
    await ref.set({userId,promptId,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    await this.incrementField('prompts',promptId,'saves',1);return true;
  },
  async isSaved(promptId,userId) { return (await db.collection('saved').doc(`${userId}_${promptId}`).get()).exists; },
  async getComments(promptId) {
    const s=await db.collection('comments').where('promptId','==',promptId).orderBy('createdAt','desc').limit(20).get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  },
  async addComment(promptId,userId,userName,text) {
    await db.collection('comments').add({promptId,userId,userName,text,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    await this.incrementField('prompts',promptId,'comments',1);
  },
  async getCategoryCount(cat) {
    const s=await db.collection('prompts').where('category','==',cat).where('published','==',true).get();
    return s.size;
  },
  async getUser(uid) { const d=await db.collection('users').doc(uid).get(); return d.exists?{id:d.id,...d.data()}:null; },
  async updateUser(uid,data) { await db.collection('users').doc(uid).update(data); },
  async getAllUsers(limit=100) {
    const s=await db.collection('users').orderBy('createdAt','desc').limit(limit).get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  },
  async searchPrompts(term) {
    const tl=term.toLowerCase();
    const s=await db.collection('prompts').where('published','==',true).limit(100).get();
    return s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>
      (p.title||'').toLowerCase().includes(tl)||(p.description||'').toLowerCase().includes(tl)||
      (p.tool||'').toLowerCase().includes(tl)||(p.category||'').toLowerCase().includes(tl)||
      (p.tags||[]).some(t=>t.toLowerCase().includes(tl))
    );
  },
  async getAnalytics() {
    const [us,ps]=await Promise.all([db.collection('users').get(),db.collection('prompts').get()]);
    const prompts=ps.docs.map(d=>d.data());
    const totalViews=prompts.reduce((s,p)=>s+(p.views||0),0);
    const totalLikes=prompts.reduce((s,p)=>s+(p.likes||0),0);
    const totalCopies=prompts.reduce((s,p)=>s+(p.copies||0),0);
    const topByLikes=[...prompts].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,5);
    const topByCopies=[...prompts].sort((a,b)=>(b.copies||0)-(a.copies||0)).slice(0,5);
    return {totalUsers:us.size,totalPrompts:ps.size,totalViews,totalLikes,totalCopies,topByLikes,topByCopies};
  },
  // Contact messages
  async sendContact(data) {
    return await db.collection('contacts').add({...data,read:false,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  },
  async getContacts(limit=50) {
    const s=await db.collection('contacts').orderBy('createdAt','desc').limit(limit).get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  },
  async markContactRead(id) { await db.collection('contacts').doc(id).update({read:true}); },
  async deleteContact(id) { await db.collection('contacts').doc(id).delete(); },

 


  // ── CATEGORIES (Firestore-backed) ──
     async getCategories(activeOnly=true) {
    let q = db.collection('categories').orderBy('sortOrder','asc');
    if(activeOnly) q = db.collection('categories').where('status','==','active').orderBy('sortOrder','asc');
    try {
      const s = await q.get();
      return s.docs.map(d=>({id:d.id,...d.data()}));
    } catch(e) {
      // Fallback if index not ready
      const s = await db.collection('categories').get();
      const cats = s.docs.map(d=>({id:d.id,...d.data()}));
      if(activeOnly) return cats.filter(c=>c.status==='active').sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
      return cats.sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
    }
  },
  async getCategory(id) {
    const d=await db.collection('categories').doc(id).get();
    return d.exists?{id:d.id,...d.data()}:null;
  },
  async createCategory(data) {
    return await db.collection('categories').add({
      ...data,
      status: data.status||'active',
      sortOrder: data.sortOrder||0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },
  async updateCategory(id,data) {
    await db.collection('categories').doc(id).update({...data,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  },
  async deleteCategory(id) { await db.collection('categories').doc(id).delete(); },

  // ── BANNERS ──
  async getBanners(activeOnly=false) {
    let q = db.collection('banners').orderBy('sort','asc');
    try {
      const s = await q.get();
      let banners = s.docs.map(d=>({id:d.id,...d.data()}));
      if(activeOnly) banners = banners.filter(b=>b.active!==false);
      return banners;
    } catch(e) {
      // Fallback without orderBy if index not ready
      const s = await db.collection('banners').get();
      let banners = s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sort||0)-(b.sort||0));
      if(activeOnly) banners = banners.filter(b=>b.active!==false);
      return banners;
    }
  },
  async createBanner(data) {
    return await db.collection('banners').add({
      ...data,
      active: data.active!==undefined ? data.active : true,
      sort: data.sort||0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },
  async updateBanner(id, data) {
    await db.collection('banners').doc(id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },
  async deleteBanner(id) { await db.collection('banners').doc(id).delete(); }
};
console.log('🔥 Firebase initialized – PromptHub');
