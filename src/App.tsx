/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./services/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const Home = lazy(() => import("./pages/public/Home"));
const Packages = lazy(() => import("./pages/public/Packages"));
const PackageDetails = lazy(() => import("./pages/public/PackageDetails"));
const Cart = lazy(() => import("./pages/public/Cart"));
const Payment = lazy(() => import("./pages/public/Payment"));
const Schedule = lazy(() => import("./pages/public/Schedule"));
const Login = lazy(() => import("./pages/auth/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

const LoadingFallback = () => (
   <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
   </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="pacotes" element={<Packages />} />
              <Route path="pacote/:id" element={<PackageDetails />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="pagamento" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="agendamento" element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/crm" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Client Routes */}
              <Route path="painel" element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="cliente" element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Route>
            
            {/* Full screen auth routes */}
            <Route path="/login" element={<Login />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
