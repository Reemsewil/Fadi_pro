// Firebase link: email sign-in + one Firestore collection per user (users/{uid}/cards), cached for offline use.
import { firebaseConfig } from './firebase-config.js';
const A = window.app, $ = s => document.querySelector(s);
const configured = firebaseConfig && firebaseConfig.apiKey && !/^PASTE/.test(firebaseConfig.apiKey);
if (!configured) A.startLocal();
else {
  const B = 'https://www.gstatic.com/firebasejs/10.14.1/';
  try {
    const [{ initializeApp }, au, fs] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
    const app = initializeApp(firebaseConfig);
    const auth = au.getAuth(app);
    let db;
    try { db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) }); }
    catch { db = fs.getFirestore(app); }
    let unsub = null;
    const msg = e => ({
      'auth/invalid-credential': 'الإيميل أو كلمة السر غلط', 'auth/wrong-password': 'الإيميل أو كلمة السر غلط', 'auth/user-not-found': 'ما في حساب بهذا الإيميل، اضغط «حساب جديد»',
      'auth/email-already-in-use': 'هذا الإيميل عنده حساب، اضغط «دخول»', 'auth/weak-password': 'كلمة السر لازم 6 أحرف على الأقل', 'auth/invalid-email': 'الإيميل مو صحيح',
      'auth/network-request-failed': 'ما في اتصال بالإنترنت', 'auth/too-many-requests': 'محاولات كتير، جرّب بعد شوي', 'auth/operation-not-allowed': 'فعّل Email/Password من إعدادات Firebase'
    }[e.code] || 'ما مشي الحال، جرّب مرة ثانية');
    const creds = () => [$('#auEmail').value.trim(), $('#auPass').value];
    const run = async fn => { $('#auErr').textContent = ''; try { await fn() } catch (e) { $('#auErr').textContent = msg(e) } };
    $('#authForm').addEventListener('submit', e => { e.preventDefault(); run(() => au.signInWithEmailAndPassword(auth, ...creds())) });
    $('#auNew').onclick = () => { if (!$('#authForm').reportValidity()) return; run(() => au.createUserWithEmailAndPassword(auth, ...creds())) };
    $('#auReset').onclick = () => { const [em] = creds(); if (!em) { $('#auErr').textContent = 'اكتب إيميلك أولاً'; return } run(async () => { await au.sendPasswordResetEmail(auth, em); $('#auErr').textContent = 'بعتنالك رابط تغيير كلمة السر على الإيميل' }) };
    $('#logout').onclick = () => au.signOut(auth);
    au.onAuthStateChanged(auth, user => {
      if (unsub) { unsub(); unsub = null }
      $('#auth').hidden = !!user; $('#logout').hidden = !user;
      if (!user) { A.signedOut(); return }
      const col = fs.collection(db, 'users', user.uid, 'cards');
      A.startCloud({
        put: (id, data) => { fs.setDoc(id ? fs.doc(col, id) : fs.doc(col), data).catch(() => A.toast('ما انحفظ على الحساب، تأكد من الاتصال')) },
        del: id => { fs.deleteDoc(fs.doc(col, id)).catch(() => A.toast('ما انحذف، تأكد من الاتصال')) }
      });
      unsub = fs.onSnapshot(col, snap => A.cloudItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => A.fail('ما قدرنا نقرأ البيانات. تأكد من قواعد Firestore ومن الاتصال.'));
    });
  } catch (e) { A.fail('ما في اتصال بالإنترنت. افتح التطبيق مرة ثانية لما يرجع النت.') }
}
