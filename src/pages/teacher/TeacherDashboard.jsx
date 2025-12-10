// src/pages/teacher/TeacherDashboard.jsx
import notusLogo2 from "../../assets/notus-logo2.png";
import utworzZajeciaIcon from "../../assets/icons/utworz-zajecia-icon.png";
import planZajecIcon from "../../assets/icons/plan-zajec-icon.png";
import historiaZajecIcon from "../../assets/icons/historia-zajec-icon.png";
import kontoIcon from "../../assets/icons/konto-icon.png";
import React, { useContext } from "react";
import { AuthContext } from "../../App";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const firstName = (user?.name || "Teacher").split(" ")[0];
  const navigate = useNavigate();

  // Data (opcjonalnie, jeśli chcesz też tutaj datę)
  const today = new Date().toLocaleDateString('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long'
  });
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const goToProfile = () => navigate("/teacher/profile");
  const goToSchedule = () => navigate("/teacher/schedule");

  return (
    <div className="home-page">
      <div className="home-page-header">
        <div className="logo-wrapper">
            <img src={notusLogo2} alt="Notus Logo" className="logo-img" />
        </div>
        <h1 className="hello-message">Witaj, {firstName}</h1>
        {/* Możesz dodać datę tutaj tak samo jak u studenta */}
        <p className="date-display">{formattedDate}</p>
      </div>

      {/* Białe pole z kafelkami */}
      <div className="home-page-content">
        <div className="tile-grid">

          <button className="tile">
            <span className="tile-icon"> 
              <img src={utworzZajeciaIcon} alt="Utwórz zajęcia icon" className="tile-icon-img" />
            </span>
            <span className="tile-title">Utwórz zajęcia</span>
          </button>

          <button className="tile" onClick={goToSchedule}>
            <span className="tile-icon">
              <img src={planZajecIcon} alt="Plan zajęć icon" className="tile-icon-img" />
            </span>
            <span className="tile-title">Plan zajęć</span>
          </button>

          <button className="tile">
            <span className="tile-icon">
              <img src={historiaZajecIcon} alt="Historia zajęć icon" className="tile-icon-img" />
            </span>
            <span className="tile-title">Historia zajęć</span>
          </button>

          <button className="tile" onClick={goToProfile}>
            <span className="tile-icon">
              <img src={kontoIcon} alt="Konto icon" className="tile-icon-img" />
            </span>
            <span className="tile-title">Konto</span>
          </button>

        </div>
      </div>

      {/* USUNIĘTO SEKCJĘ <nav className="bottom-nav"> */}
    </div>
  );
};

export default TeacherDashboard;