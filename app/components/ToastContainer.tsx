import React from 'react';
import { ToastContainer as ReactToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const ToastContainer = () => {
  return (
    <ReactToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={false}
      theme="dark"
    />
  );
//   position: "top-right",
//   autoClose: 4000,
//   hideProgressBar: false,
//   closeOnClick: true,
//   pauseOnHover: true,
//   draggable: true,
//   style: {
//     background: "rgba(30, 30, 30, 0.9)",
//     backdropFilter: "blur(12px)",
//     color: "#ffffff",
//     borderLeft: "4px solid #10b981",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
//     fontWeight: 500,
//     borderRadius: "8px",
//     padding: "16px",
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     maxWidth: "400px", // Prevents content from being too wide
//     wordWrap: "break-word", // Ensures long text wraps properly
//     whiteSpace: "normal", // Prevents text from cutting off
//   },
};