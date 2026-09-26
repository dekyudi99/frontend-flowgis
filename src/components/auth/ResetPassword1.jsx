import React from 'react';
import { NavLink } from 'react-router-dom';

const ResetPassword1 = () => {
  return (
    <React.Fragment>
      {/* <Breadcrumb /> */}
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        
        {/* Card Container */}
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-8">
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/flowgis-logo.png" className="w-16 h-16" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
          </div>

          {/* Form / Input Area */}
          <div className="space-y-6">
            <div>
              
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                id="email"
                type="email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" 
                placeholder="Enter your email address" 
              />
            </div>
            
            <button 
              type="button" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-colors"
            >
              Reset password
            </button>
          </div>

          {/* Bagian Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don’t have an account?{' '}
            <NavLink to="/auth/signup-1" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Signup
            </NavLink>
          </p>

        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPassword1;