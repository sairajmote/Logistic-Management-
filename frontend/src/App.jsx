import { useEffect, useState } from "react";
import "./App.css"
function App() {


  const [shipments, setShipments] = useState([]);
  const [showform, setShowform] = useState(false);
  const [newshipment, setNewshipment] = useState(
    {
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

  const totalPages = Math.ceil(filteredShipments.length / shipmentsPerPage);

  const startIndex = (currentPage - 1) * shipmentsPerPage;

  const paginatedShipments = filteredShipments.slice(
    startIndex,
    startIndex + shipmentsPerPage
  );


  useEffect(() => {
    if (!token)
      return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    setRole(payload.role);

    fetch("http://127.0.0.1:8000/shipments", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Shipment")
        }
        return response.json();
      }
      )
      .then((data) => setShipments(data))
      .catch((error) => alert(error.message))

    fetch("http://127.0.0.1:8000/products", {
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

    fetch("http://127.0.0.1:8000/suppliers", {
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
      fetch("http://127.0.0.1:8000/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => response.json())
        .then((data) => setUsers(data))
        .catch((error) => console.error(error));
    }
  },
    [token]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);
  useEffect(() => {
    if (activeSection !== "shipments") {
      setShowform(false);
    }
  }, [activeSection]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);


  async function handleSubmit(e) {
    e.preventDefault();

    const url = editId
      ? `http://127.0.0.1:8000/shipments/${editId}`
      : "http://127.0.0.1:8000/shipments";

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
      alert(data.detail)
    }

    if (response.ok) {
      const updatedResponse = await fetch(
        "http://127.0.0.1:8000/shipments",
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
    const response = await fetch(`http://127.0.0.1:8000/shipments/${id}`,
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
        "http://127.0.0.1:8000/shipments", {
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
      ? `http://127.0.0.1:8000/products/${editProductId}`
      : "http://127.0.0.1:8000/products";

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
        "http://127.0.0.1:8000/products", {
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
    const response = await fetch(`http://127.0.0.1:8000/products/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }

      }
    ); if (!response.ok) {
      const data = await response.json();
      alert(data.detail);
      return;
    }

    if (response.ok) {
      const updatedResponse = await fetch("http://127.0.0.1:8000/products",
        {
          headers: {
            Authorization: `bearer ${token}`
          }
        }
      );
      const updatedProducts = await updatedResponse.json();
      setProducts(updatedProducts)
    };

  }
  async function handleEditProduct(product) {
    setEditProductId(product.id);
    setNewProduct(product.name);
    setShowProductForm(true);
  }

  async function handleAddSupplier() {
    const url = editSupplierId
      ? `http://127.0.0.1:8000/suppliers/${editSupplierId}`
      : "http://127.0.0.1:8000/suppliers";

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
        "http://127.0.0.1:8000/suppliers", {
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
      `http://127.0.0.1:8000/suppliers/${id}`,
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
        "http://127.0.0.1:8000/suppliers", {
        headers: {
          Authorization: `bearer ${token}`
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
      "http://127.0.0.1:8000/login",
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
      "http://127.0.0.1:8000/users",
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
      "http://127.0.0.1:8000/users",
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
      <form onSubmit={handleLogin} className="login-Card">
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

        <button type="submit">Login</button>
      </form>
    );
  }


  return (

    <div className="app">
      <div className="navbar">
        <button onClick={() => setActiveSection("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveSection("shipments")}>Shipments</button>
        <button onClick={() => setActiveSection("products")}>Products</button>
        {role != "supplier" && (<button onClick={() => setActiveSection("suppliers")}>Supplier</button>)}
        {role === "admin" && (
          <button onClick={() => setActiveSection("users")}>
            Users
          </button>
        )}
        <button onClick={() => {
          localStorage.removeItem("token");
          setToken(null)
        }}>
          Log Out
        </button>
      </div>

      <h1>Commmodity Manaegment System</h1>

      {showform && (
        <>

          <form onSubmit={handleSubmit}>

            {
              role === "admin" && (
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
                    <option value="">Select Product</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                </div>
              )
            }

            <div>
              <select value={newshipment.supplier_id}
                onChange={(e) =>
                  setNewshipment({
                    ...newshipment, supplier_id: e.target.value
                  })
                }>
                <option value="">Select Supplier</option>
                {
                  suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>

                  ))
                }



              </select>
            </div>
            {
              role === "admin" && (<div>
                <input placeholder="Quantity" value={newshipment.quantity} onChange={(e) =>
                  setNewshipment(
                    {
                      ...newshipment, quantity: e.target.value
                    }
                  )
                } />
              </div>
              )
            }
            {
              role === "admin" && (<div>
                <input placeholder="Origin" value={newshipment.origin} onChange={(e) =>
                  setNewshipment(
                    {
                      ...newshipment, origin: e.target.value
                    }
                  )
                } />
              </div>)
            }

            {
              role === "admin" && (<div>
                <input placeholder="Destination" value={newshipment.destination} onChange={(e) =>
                  setNewshipment(
                    {
                      ...newshipment, destination: e.target.value
                    }
                  )
                } />
              </div>
              )
            }
            <div>
              <select value={newshipment.status} onChange={(e) =>
                setNewshipment({
                  ...newshipment, status: e.target.value
                })
              }>
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <button type="submit">
              {editId ? "Update Shipment" : "Create Shipment"}
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

          </form></>
      )}

      {activeSection === "dashboard" && (
        <div className="dashboard">
          <h2>Dashboard</h2>
          <p>Overview of your commodity operations</p>

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
            <h3>Shipment Status</h3>

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
            <h3>Recent Shipments</h3>

            {shipments.slice(-5).reverse().map((shipment) => (
              <div className="recent-shipment" key={shipment.id}>
                <div>
                  <strong>{shipment.product}</strong>
                  <p>{shipment.origin} → {shipment.destination}</p>
                </div>

                <span className={`status ${shipment.status.toLowerCase().replace(" ", "-")}`}>
                  {shipment.status}
                </span>
              </div>
            ))}
          </div>
          {role === "admin" && (<div className="quick-actions">
            <h3>Quick Actions</h3>

            <div className="action-grid">

              <button onClick={() => {
                setActiveSection("shipments");
                setShowform(true);
              }}>
                + Add Shipment
              </button>

              <button onClick={() => setActiveSection("products")}>
                Manage Products
              </button>

              <button onClick={() => setActiveSection("suppliers")}>
                Manage Suppliers
              </button>

            </div>
          </div>
          )}
        </div>
      )}

      {
        activeSection === "shipments" && (
          <>
            {
              role === "admin" && (<button onClick={() => setShowform(true)}>
                Add Shipment
              </button>)
            }
            <div className="shipment-filters">
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="shipment-list" >
              {paginatedShipments.map((shipment) => (
                <div key={shipment.id}>
                  <h2>Product: {shipment.product}</h2>

                  <p>Supplier: {shipment.supplier}</p>
                  <p>Quantity: {shipment.quantity}</p>
                  <p>Origin: {shipment.origin}</p>
                  <p>Destination: {shipment.destination}</p>
                  <p className={`status ${shipment.status.toLowerCase().replace(" ", "-")}`}>
                    {shipment.status}
                  </p>
                  {(role === "admin" || role === "supplier") && (
                    <button onClick={() => handleEdit(shipment)}>
                      {role === "admin" ? "Edit" : "Update Status"}
                    </button>
                  )}
                  {role === "admin" && (<button onClick={() => handleDelete(shipment.id)}>Delete</button>)}


                  <br />
                </div>
              ))}
            </div>
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>)
      }

      {activeSection === "products" && (
        <div className="productlist">
          <h3>Products:</h3>
          {role === "admin" && (<button onClick={() => { setShowProductForm(true) }}>Add Product</button>)}
          {
            showProductForm && (
              <div>
                <input placeholder="Product Name" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
                {
                  role === "admin" && (
                    <button onClick={handleAddProduct}>{editProductId ? "Update" : "Add"}</button>
                  )
                }
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setEditProductId(null);
                    setNewProduct("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )
          }
          {
            products.map((product) => (
              <div key={product.id}>
                <p>{product.name}</p>
                {role === "admin" && (<button onClick={() => handleEditProduct(product)}>Edit</button>)}
                {role === "admin" && (<button onClick={() => handleDeleteProduct(product.id)}>Delete</button>)}


              </div>
            ))
          }
        </div>
      )}

      {
        activeSection === "suppliers" && (
          <div className="supplierlist">
            <h3>Suppliers:</h3>

            {role === "admin" && (<button onClick={() => setShowSupplierForm(true)}>
              Add Supplier
            </button>)}

            {showSupplierForm && (
              <div>
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

                <button onClick={handleAddSupplier}>
                  {editSupplierId ? "Update" : "Add"}
                </button>
                <button
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
            )}

            {suppliers.map((supplier) => (
              <div key={supplier.id}>
                <p>Name: {supplier.name}</p>
                <p>Country: {supplier.country}</p>

                {role === "admin" && (<button onClick={() => handleEditSupplier(supplier)}>
                  Edit
                </button>)}

                {role === "admin" && (<button onClick={() => handleDeleteSupplier(supplier.id)}>
                  Delete
                </button>)}
              </div>
            ))}
          </div>
        )
      }
      {activeSection === "users" && role === "admin" && (
        <div className="section">

          <div className="section-header">
            <h2>Users</h2>

            <button
              onClick={() => setShowUserForm(!showUserForm)}
            >
              {showUserForm ? "Cancel" : "Add User"}
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
                <option value="user">User</option>
                <option value="supplier">Supplier</option>
                <option value="admin">Admin</option>
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

                    <td>{user.id}</td>

                    <td>{user.username}</td>

                    <td>{user.role}</td>

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
