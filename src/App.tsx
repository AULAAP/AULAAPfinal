import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BeneficiaryList from './components/BeneficiaryList';
import Attendance from './components/Attendance';
import Sections from './components/Sections';
import Reports from './components/Reports';
import AdminPanel from './components/AdminPanel';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import { User } from './types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ApprovedEmail } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      try {
        setAuthError(null);
        if (firebaseUser) {
          setLoading(true);
          console.log('Verifying user permissions...');
          // Check if email is approved
          const approvedQuery = query(
            collection(db, 'approved_emails'),
            where('email', '==', firebaseUser.email)
          );
          const approvedSnapshot = await getDocs(approvedQuery);

          const masterAdmins = ['ramonalduey@gmail.com', 'ramonalduey01@gmail.com'];
          const userEmail = firebaseUser.email || '';
          const isMasterAdminEmail = masterAdmins.includes(userEmail);

          if (approvedSnapshot.empty && !isMasterAdminEmail) {
            console.log('User not authorized:', userEmail);
            await signOut(auth);
            setAuthError('Tu correo no está autorizado para acceder a esta plataforma. Contacta al administrador.');
            setUser(null);
            setLoading(false);
            return;
          }

          const approvedData = approvedSnapshot.empty ? null : approvedSnapshot.docs[0].data() as ApprovedEmail;
          if (approvedData && (approvedData.role as any) === 'user') {
            approvedData.role = 'tutor';
          }
          const isAdminEmail = isMasterAdminEmail;

          console.log('Fetching user profile...');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const authDisplayName = firebaseUser.displayName;
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const role = isAdminEmail ? 'admin' : (approvedData?.role || (userData.role as any));
            const churchId = isAdminEmail ? 'ADMINISTRACIÓN CENTRAL' : (approvedData?.churchId || userData.churchId);
            let username = userData.username;

            // Force name for master admins, otherwise use approved name, Auth display name or generic
            if (isMasterAdminEmail) {
              username = 'Ramón Alduey';
            } else if (approvedData?.name) {
              username = approvedData.name;
            } else {
              const isGenericName = username === 'Administrador' || username === 'Tutor' || !username;
              if (authDisplayName && (isGenericName || username !== authDisplayName)) {
                username = authDisplayName;
              }
            }

            // Update churchId/role/username if needed
            const needsUpdate = (approvedData && (churchId !== approvedData.churchId || role !== approvedData.role)) || 
                              (isAdminEmail && userData.role !== 'admin') ||
                              (username !== userData.username);

            if (needsUpdate) {
              const updatedUser: User = { 
                ...userData,
                uid: userData.uid || firebaseUser.uid,
                username: username,
                email: userData.email || firebaseUser.email || '',
                churchId: churchId, 
                role: role 
              };
              console.log('Updating user profile...');
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser);
              setUser(updatedUser);
            } else {
              setUser({ ...userData, username, churchId, role });
            }
          } else {
            console.log('Creating new user profile...');
            // New user, create profile
            const isEmailProvider = firebaseUser.providerData.some(p => p.providerId === 'password');
            
            const newUser: User = {
              uid: firebaseUser.uid,
              username: isMasterAdminEmail ? 'Ramón Alduey' : (approvedData?.name || authDisplayName || 'Tutor'),
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : (approvedData?.role || 'tutor'),
              churchId: isAdminEmail ? 'ADMINISTRACIÓN CENTRAL' : (approvedData?.churchId || ''),
              mustChangePassword: isEmailProvider
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
          console.log('User profile loaded successfully');
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);
        setAuthError('Error al cargar el perfil: ' + (error.message || 'Error desconocido'));
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage user={user} />} 
        />
        
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login error={authError} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard user={user!} />} />
          <Route path="beneficiaries" element={<BeneficiaryList user={user!} />} />
          <Route path="attendance" element={<Attendance user={user!} />} />
          <Route path="sections" element={<Sections user={user!} />} />
          <Route path="reports" element={<Reports user={user!} />} />
          <Route path="admin" element={<AdminPanel user={user!} />} />
        </Route>

        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
