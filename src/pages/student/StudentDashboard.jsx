// src/pages/student/StudentDashboard.jsx
import notusLogo2 from "../../assets/notus-logo2.png";
import skanujQRIcon from "../../assets/icons/skanuj-qr-icon.png";
import planZajecIcon from "../../assets/icons/plan-zajec-icon.png";
import historiaZajecIcon from "../../assets/icons/historia-zajec-icon.png";
import kontoIcon from "../../assets/icons/konto-icon.png";
import React, { useContext } from "react";
import { AuthContext } from "../../App";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
   const { user } = useContext(AuthContext);
   const firstName = (user?.name || "Student").split(" ")[0];
   const navigate = useNavigate();
   
   // Data
   const today = new Date().toLocaleDateString('pl-PL', {
       weekday: 'long',
       day: 'numeric',
       month: 'long'
   });
   const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

   // Nawigacja
   const goToProfile = () => navigate("/student/profile");
   const goToSchedule = () => navigate("/student/schedule");
   const goToScanQR = () => navigate("/student/scan-qr");

  return (
    <div className="home-page">
      <div className="home-page-header">
        <div className="logo-wrapper">
            <img src={notusLogo2} alt="Notus Logo" className="logo-img" />
        </div>
        
        <h1 className="hello-message">Witaj, {firstName}</h1>
        <p className="date-display">{formattedDate}</p>
      </div>

      <div className="home-page-content">
        <div className="tile-grid">
          
          <button className="tile" onClick={goToScanQR}>
            <span className="tile-icon">
              <img src={skanujQRIcon} alt="Skanuj QR" className="tile-icon-img" />
            </span>
            <span className="tile-title">Skanuj QR</span>
          </button>

          <button className="tile" onClick={goToSchedule}>
            <span className="tile-icon">
              <img src={planZajecIcon} alt="Plan zajęć" className="tile-icon-img" />
            </span>
            <span className="tile-title">Plan zajęć</span>
          </button>

          <button className="tile">
            <span className="tile-icon">
              <img src={historiaZajecIcon} alt="Historia" className="tile-icon-img" />
            </span>
            <span className="tile-title">Historia zajęć</span>
          </button>

          <button className="tile" onClick={goToProfile}>
            <span className="tile-icon">
              <img src={kontoIcon} alt="Konto" className="tile-icon-img" />
            </span>
            <span className="tile-title">Konto</span>
          </button>
        </div>
      </div>
      
      {/* USUNIĘTO SEKCJĘ <nav className="bottom-nav"> */}
    </div>
  );
};

export default StudentDashboard;