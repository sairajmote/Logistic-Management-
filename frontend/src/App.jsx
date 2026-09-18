import { useEffect, useState } from "react";
import "./App.css";
import loginHero from "./assets/login-hero.jpg";
import loginHeroDark from "./assets/login-hero-dark.jpg";

const API_URL = import.meta.env.VITE_API_URL;

console.log("API URL:", API_URL);

function ThemeToggle({ darkMode, setDarkMode, className = "" }) {
  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={() => setDarkMode((prev) => !prev)}
      aria-label="Toggle dark mode"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <svg
          className="theme-icon"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          className="theme-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  const [shipments, setShipments] = useState([]);
  const [showform, setShowform] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [newshipment, setNewshipment] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    origin: "",
    destination: "",
    status: ""
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editId, setEditId] = useState(null);

  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [editProductId, setEditProductId] = useState(null);

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    country: ""
  });
  const [editSupplierId, setEditSupplierId] = useState(null);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const shipmentsPerPage = 6;

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);

  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
    supplier_id: ""
  });

  const totalShipments = shipments.length;
  const totalProducts = products.length;
  const totalSuppliers = suppliers.length;

  const pendingShipments = shipments.filter(
    (shipment) => shipment.status === "Pending"
  ).length;

  const inTransitShipments = shipments.filter(
    (shipment) => shipment.status === "In Transit"
  ).length;

  const deliveredShipments = shipments.filter(
    (shipment) => shipment.status === "Delivered"
  ).length;

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(
    filteredShipments.length / shipmentsPerPage
  );

  const startIndex = (currentPage - 1) * shipmentsPerPage;

  const paginatedShipments = filteredShipments.slice(
    startIndex,
    startIndex + shipmentsPerPage
  );

  useEffect(() => {
    if (!token) return;

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    setRole(payload.role);

    fetch(`${API_URL}/shipments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Shipment");
        }

        return response.json();
      })
      .then((data) => setShipments(data))
      .catch((error) => alert(error.message));

    fetch(`${API_URL}/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => setProducts(data))
      .catch((error) => alert(error.message));

    fetch(`${API_URL}/suppliers`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load suppliers");
        }

        return response.json();
      })
      .then((data) => setSuppliers(data))
      .catch((error) => alert(error.message));

    if (payload.role === "admin") {
      fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => response.json())
        .then((data) => setUsers(data))
        .catch((error) => console.error(error));
    }
  }, [token]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "shipments") {
      setShowform(false);
    }
    setMenuOpen(false);
  }, [activeSection]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleNavigate(section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  async function handleSubmit(e) {
    e.preventDefault();

    const url = editId
      ? `${API_URL}/shipments/${editId}`
      : `${API_URL}/shipments`;

    const method = editId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newshipment,
        product_id: Number(newshipment.product_id),
        supplier_id: Number(newshipment.supplier_id),
        quantity: Number(newshipment.quantity)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/shipments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedShipments = await updatedResponse.json();

      setShipments(updatedShipments);

      setNewshipment({
        product_id: "",
        supplier_id: "",
        quantity: "",
        origin: "",
        destination: "",
        status: ""
      });

      setEditId(null);
      setShowform(false);
    }
  }

  async function handleDelete(id) {
    const response = await fetch(
      `${API_URL}/shipments/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/shipments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedShipments = await updatedResponse.json();

      setShipments(updatedShipments);
    }
  }

  async function handleEdit(shipment) {
    setEditId(shipment.id);

    setNewshipment({
      product_id: shipment.product_id,
      supplier_id: shipment.supplier_id,
      quantity: shipment.quantity,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status
    });

    setShowform(true);
  }

  async function handleAddProduct() {
    const url = editProductId
      ? `${API_URL}/products/${editProductId}`
      : `${API_URL}/products`;

    const method = editProductId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newProduct
      })
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedProducts = await updatedResponse.json();

      setProducts(updatedProducts);
      setNewProduct("");
      setEditProductId(null);
      setShowProductForm(false);
    }
  }

  async function handleDeleteProduct(id) {
    const response = await fetch(
      `${API_URL}/products/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedProducts = await updatedResponse.json();

      setProducts(updatedProducts);
    }
  }

  async function handleEditProduct(product) {
    setEditProductId(product.id);
    setNewProduct(product.name);
    setShowProductForm(true);
  }

  async function handleAddSupplier() {
    const url = editSupplierId
      ? `${API_URL}/suppliers/${editSupplierId}`
      : `${API_URL}/suppliers`;

    const method = editSupplierId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newSupplier)
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedSuppliers = await updatedResponse.json();

      setSuppliers(updatedSuppliers);

      setNewSupplier({
        name: "",
        country: ""
      });

      setEditSupplierId(null);
      setShowSupplierForm(false);
    }
  }

  function handleEditSupplier(supplier) {
    setEditSupplierId(supplier.id);

    setNewSupplier({
      name: supplier.name,
      country: supplier.country
    });

    setShowSupplierForm(true);
  }

  async function handleDeleteSupplier(id) {
    const response = await fetch(
      `${API_URL}/suppliers/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        `${API_URL}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedSuppliers = await updatedResponse.json();

      setSuppliers(updatedSuppliers);
    }
  }

  async function getErrorMessage(response) {
    try {
      const data = await response.json();

      if (Array.isArray(data.detail)) {
        return data.detail
          .map((error) => error.msg)
          .join(", ");
      }

      return data.detail || "Something went wrong";
    } catch {
      return "Something went wrong";
    }
  }

  async function handleLogin(e) {
    e.preventDefault();

    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail);
      return;
    }

    localStorage.setItem("token", data.access_token);

    setToken(data.access_token);

    const payload = JSON.parse(
      atob(data.access_token.split(".")[1])
    );

    setRole(payload.role);

    setUserName("");
    setPassword("");
  }

  async function handleAddUser(e) {
    e.preventDefault();

    const response = await fetch(
      `${API_URL}/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          supplier_id:
            newUser.role === "supplier"
              ? Number(newUser.supplier_id)
              : null
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail);
      return;
    }

    // Refresh users after creating one
    const updatedResponse = await fetch(
      `${API_URL}/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updatedUsers = await updatedResponse.json();

    setUsers(updatedUsers);

    setNewUser({
      username: "",
      password: "",
      role: "user",
      supplier_id: ""
    });

    setShowUserForm(false);
  }

  if (!token) {
    return (
      <div className="login-wrapper">
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          className="login-theme-toggle"
        />

        <div className="login-card">
          <div className="login-card-left">
            <img
              src={darkMode ? loginHeroDark : loginHero}
              alt="Commodity Logistics Hub"
              className="login-card-img"
            />
          </div>

          <div className="login-card-divider"></div>

          <div className="login-card-right">
            <form onSubmit={handleLogin} className="login-form">
              <h2>Commodity Management System</h2>
              <i>"User Name": Demo_Admin <br />
                  "Password": demo@0987
              </i>
              <p>Sign in to your account</p>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      <div className="navbar">
        <div
          className="nav-brand"
          onClick={() => handleNavigate("dashboard")}
        >
          <span className="brand-dot"></span>
          Commodity System
        </div>

        <div className="navbar-actions">
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

          <button
            type="button"
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>

          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <button
              className={activeSection === "dashboard" ? "active" : ""}
              onClick={() => handleNavigate("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={activeSection === "shipments" ? "active" : ""}
              onClick={() => handleNavigate("shipments")}
            >
              Shipments
            </button>

            <button
              className={activeSection === "products" ? "active" : ""}
              onClick={() => handleNavigate("products")}
            >
              Products
            </button>

            {role !== "supplier" && (
              <button
                className={activeSection === "suppliers" ? "active" : ""}
                onClick={() => handleNavigate("suppliers")}
              >
                Supplier
              </button>
            )}

            {role === "admin" && (
              <button
                className={activeSection === "users" ? "active" : ""}
                onClick={() => handleNavigate("users")}
              >
                Users
              </button>
            )}

            <button
              className="logout-nav-btn"
              onClick={() => {
                setMenuOpen(false);
                localStorage.removeItem("token");
                setToken(null);
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <h1>
        Commodity Management System
      </h1>

      {showform && (
        <>
          <form onSubmit={handleSubmit}>

            {role === "admin" && (
              <div>
                <select
                  value={newshipment.product_id}
                  onChange={(e) =>
                    setNewshipment({
                      ...newshipment,
                      product_id: e.target.value
                    })
                  }
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <select
                value={newshipment.supplier_id}
                onChange={(e) =>
                  setNewshipment({
                    ...newshipment,
                    supplier_id: e.target.value
                  })
                }
              >
                <option value="">
                  Select Supplier
                </option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {role === "admin" && (
              <div>
                <input
                  placeholder="Quantity"
                  value={newshipment.quantity}
                  onChange={(e) =>
                    setNewshipment({
                      ...newshipment,
                      quantity: e.target.value
                    })
                  }
                />
              </div>
            )}

            {role === "admin" && (
              <div>
                <input
                  placeholder="Origin"
                  value={newshipment.origin}
                  onChange={(e) =>
                    setNewshipment({
                      ...newshipment,
                      origin: e.target.value
                    })
                  }
                />
              </div>
            )}

            {role === "admin" && (
              <div>
                <input
                  placeholder="Destination"
                  value={newshipment.destination}
                  onChange={(e) =>
                    setNewshipment({
                      ...newshipment,
                      destination: e.target.value
                    })
                  }
                />
              </div>
            )}

            <div>
              <select
                value={newshipment.status}
                onChange={(e) =>
                  setNewshipment({
                    ...newshipment,
                    status: e.target.value
                  })
                }
              >
                <option value="">
                  Select Status
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="In Transit">
                  In Transit
                </option>

                <option value="Delivered">
                  Delivered
                </option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit">
                {editId
                  ? "Update Shipment"
                  : "Create Shipment"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowform(false);
                  setEditId(null);

                  setNewshipment({
                    product_id: "",
                    supplier_id: "",
                    quantity: "",
                    origin: "",
                    destination: "",
                    status: ""
                  });
                }}
              >
                Cancel
              </button>
            </div>

          </form>
        </>
      )}

      {activeSection === "dashboard" && (
        <div className="dashboard">

          <h2>
            Dashboard
          </h2>

          <p>
            Overview of your commodity operations
          </p>

          <div className="stats-grid">

            <div className="stat-card">
              <h3>Total Shipments</h3>
              <h1>{totalShipments}</h1>
            </div>

            <div className="stat-card">
              <h3>Total Products</h3>
              <h1>{totalProducts}</h1>
            </div>

            <div className="stat-card">
              <h3>Total Suppliers</h3>
              <h1>{totalSuppliers}</h1>
            </div>

            <div className="stat-card">
              <h3>Pending Shipments</h3>
              <h1>{pendingShipments}</h1>
            </div>

          </div>

          <div className="status-breakdown">

            <h3>
              Shipment Status
            </h3>

            <div className="status-grid">

              <div className="status-box pending">
                <span>Pending</span>
                <strong>{pendingShipments}</strong>
              </div>

              <div className="status-box in-transit">
                <span>In Transit</span>
                <strong>{inTransitShipments}</strong>
              </div>

              <div className="status-box delivered">
                <span>Delivered</span>
                <strong>{deliveredShipments}</strong>
              </div>

            </div>
          </div>

          <div className="recent-shipments">

            <h3>
              Recent Shipments
            </h3>

            {shipments
              .slice(-5)
              .reverse()
              .map((shipment) => (
                <div
                  className="recent-shipment"
                  key={shipment.id}
                >

                  <div>
                    <strong>
                      {shipment.product}
                    </strong>

                    <p>
                      {shipment.origin} → {shipment.destination}
                    </p>
                  </div>

                  <span
                    className={`status ${shipment.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {shipment.status}
                  </span>

                </div>
              ))}

          </div>

          {role === "admin" && (
            <div className="quick-actions">

              <h3>
                Quick Actions
              </h3>

              <div className="action-grid">

                <button
                  onClick={() => {
                    setActiveSection("shipments");
                    setShowform(true);
                  }}
                >
                  + Add Shipment
                </button>

                <button
                  onClick={() =>
                    setActiveSection("products")
                  }
                >
                  Manage Products
                </button>

                <button
                  onClick={() =>
                    setActiveSection("suppliers")
                  }
                >
                  Manage Suppliers
                </button>

              </div>
            </div>
          )}

        </div>
      )}

      {activeSection === "shipments" && (
        <>
          {role === "admin" && (
            <button
              onClick={() => setShowform(true)}
            >
              Add Shipment
            </button>
          )}

          <div className="shipment-filters">

            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="In Transit">
                In Transit
              </option>

              <option value="Delivered">
                Delivered
              </option>
            </select>

          </div>

          <div className="shipment-list">

            {paginatedShipments.map((shipment) => (
              <div key={shipment.id}>

                <h2>
                  Product: {shipment.product}
                </h2>

                <p>
                  Supplier: {shipment.supplier}
                </p>

                <p>
                  Quantity: {shipment.quantity}
                </p>

                <p>
                  Origin: {shipment.origin}
                </p>

                <p>
                  Destination: {shipment.destination}
                </p>

                <p
                  className={`status ${shipment.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {shipment.status}
                </p>

                <div className="card-actions">
                  {(role === "admin" ||
                    role === "supplier") && (
                      <button
                        onClick={() =>
                          handleEdit(shipment)
                        }
                      >
                        {role === "admin"
                          ? "Edit"
                          : "Update Status"}
                      </button>
                    )}

                  {role === "admin" && (
                    <button
                      onClick={() =>
                        handleDelete(shipment.id)
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>

              </div>
            ))}

          </div>

          <div className="pagination">

            <button
              onClick={() =>
                setCurrentPage(currentPage - 1)
              }
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage(currentPage + 1)
              }
              disabled={
                currentPage === totalPages
              }
            >
              Next
            </button>

          </div>
        </>
      )}

      {activeSection === "products" && (
        <div className="productlist">

          <h3>
            Products:
          </h3>

          {role === "admin" && (
            <button
              onClick={() => {
                setShowProductForm(true);
              }}
            >
              Add Product
            </button>
          )}

          {showProductForm && (
            <div className="form-card inline-form">

              <input
                placeholder="Product Name"
                value={newProduct}
                onChange={(e) =>
                  setNewProduct(e.target.value)
                }
              />

              <div className="form-actions">
                {role === "admin" && (
                  <button
                    onClick={handleAddProduct}
                  >
                    {editProductId
                      ? "Update"
                      : "Add"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditProductId(null);
                    setNewProduct("");
                  }}
                >
                  Cancel
                </button>
              </div>

            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="product-card">

              <p>
                {product.name}
              </p>

              <div className="card-actions">
                {role === "admin" && (
                  <button
                    onClick={() =>
                      handleEditProduct(product)
                    }
                  >
                    Edit
                  </button>
                )}

                {role === "admin" && (
                  <button
                    onClick={() =>
                      handleDeleteProduct(product.id)
                    }
                  >
                    Delete
                  </button>
                )}
              </div>

            </div>
          ))}

        </div>
      )}

      {activeSection === "suppliers" && (
        <div className="supplierlist">

          <h3>
            Suppliers:
          </h3>

          {role === "admin" && (
            <button
              onClick={() =>
                setShowSupplierForm(true)
              }
            >
              Add Supplier
            </button>
          )}

          {showSupplierForm && (
            <div className="form-card inline-form">

              <input
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={(e) =>
                  setNewSupplier({
                    ...newSupplier,
                    name: e.target.value
                  })
                }
              />

              <input
                placeholder="Country"
                value={newSupplier.country}
                onChange={(e) =>
                  setNewSupplier({
                    ...newSupplier,
                    country: e.target.value
                  })
                }
              />

              <div className="form-actions">
                <button
                  onClick={handleAddSupplier}
                >
                  {editSupplierId
                    ? "Update"
                    : "Add"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierForm(false);
                    setEditSupplierId(null);

                    setNewSupplier({
                      name: "",
                      country: ""
                    });
                  }}
                >
                  Cancel
                </button>
              </div>

            </div>
          )}

          {suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">

              <p>
                Name: {supplier.name}
              </p>

              <p>
                Country: {supplier.country}
              </p>

              <div className="card-actions">
                {role === "admin" && (
                  <button
                    onClick={() =>
                      handleEditSupplier(supplier)
                    }
                  >
                    Edit
                  </button>
                )}

                {role === "admin" && (
                  <button
                    onClick={() =>
                      handleDeleteSupplier(
                        supplier.id
                      )
                    }
                  >
                    Delete
                  </button>
                )}
              </div>

            </div>
          ))}

        </div>
      )}

      {activeSection === "users" &&
        role === "admin" && (
          <div className="section">

            <div className="section-header">

              <h2>
                Users
              </h2>

              <button
                onClick={() =>
                  setShowUserForm(!showUserForm)
                }
              >
                {showUserForm
                  ? "Cancel"
                  : "Add User"}
              </button>

            </div>

            {showUserForm && (
              <form
                onSubmit={handleAddUser}
                className="form"
              >

                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username: e.target.value
                    })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.target.value
                    })
                  }
                  required
                />

                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value,
                      supplier_id: ""
                    })
                  }
                >
                  <option value="user">
                    User
                  </option>

                  <option value="supplier">
                    Supplier
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>

                {newUser.role === "supplier" && (
                  <select
                    value={newUser.supplier_id}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        supplier_id: e.target.value
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Supplier
                    </option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                )}

                <button type="submit">
                  Create User
                </button>

              </form>
            )}

            <div className="table-container">

              <table>

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Supplier</th>
                  </tr>

                </thead>

                <tbody>

                  {users.map((user) => (
                    <tr key={user.id}>

                      <td>
                        {user.id}
                      </td>

                      <td>
                        {user.username}
                      </td>

                      <td>
                        {user.role}
                      </td>

                      <td>
                        {user.supplier || "-"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

    </div>
  );
}

export default App;