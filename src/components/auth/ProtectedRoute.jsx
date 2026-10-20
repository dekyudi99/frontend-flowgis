import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    user = {};
  }

  const isUnauthorized = allowedRoles && !allowedRoles.includes(user?.role);

  //Jika belum login -> lempar ke login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  //Jika role tidak sesuai -> lempar ke /map sambil MEMBAWA PESAN ERROR di state
  if (isUnauthorized) {
    return (
      <Navigate 
        to="/map" 
        state={{ errorMsg: "Access denied. This page can only be accessed by an Admin." }} 
        replace 
      />
    );
  }

  //Jika diizinkan -> tampilkan komponen halaman
  return <Outlet />;
}