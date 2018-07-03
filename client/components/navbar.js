import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar pure-menu pure-menu-horizontal">
      <Link className="link" to="/">Regulator</Link>
      <Link className="link" to="/tollbooth_operator">TollBooth Operator</Link>
    </nav>
  );
}

export default Navbar;
