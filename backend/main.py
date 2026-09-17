import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from jose import jwt
from fastapi import Depends
load_dotenv()
from fastapi.security import HTTPBearer
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
pwd_context = CryptContext(
    schemes=["bcrypt"],
        deprecated="auto"     
)   


# =========================================================
# MODELS
# =========================================================

class Shipment(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int
    origin: str
    destination: str
    status: str


class ShipmentResponse(BaseModel):
    id: int
    product_id: int
    supplier_id: int
    product: str
    supplier: str
    quantity: int
    origin: str
    destination: str
    status: str


class Product(BaseModel):
    name: str


class ProductResponse(BaseModel):
    id: int
    name: str


class Supplier(BaseModel):
    name: str
    country: str


class SupplierResponse(BaseModel):
    id: int
    name: str
    country: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    supplier_id: int | None = None
    
class UserLogin(BaseModel):
    username: str
    password: str

oauth_scheme = HTTPBearer()
def get_current_user(credentials = Depends(oauth_scheme)):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )    
        
        
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user

def require_admin_or_supplier(
    current_user : dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin","supplier"]:
        raise HTTPException(
            status_code=403,
            detail="Admin or supplier access required"
        )       
    return current_user
        
# =========================================================
# DATABASE
# =========================================================

def get_db_connection():
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL")
    )
    return conn


print("Database connection function ready")


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "API is running"
    }


# =========================================================
# SHIPMENTS
# =========================================================

# GET ALL SHIPMENTS
@app.get("/shipments", response_model=list[ShipmentResponse])
def get_shipments(): 

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                shipments.id,
                shipments.product_id,
                shipments.supplier_id,
                products.name AS product,
                suppliers.name AS supplier,
                shipments.quantity,
                shipments.origin,
                shipments.destination,
                shipments.status
            FROM shipments
            JOIN products
                ON shipments.product_id = products.id
            JOIN suppliers
                ON shipments.supplier_id = suppliers.id;
            """
        )

        rows = cursor.fetchall()

        shipments = []

        for row in rows:
            shipments.append({
                "id": row[0],
                "product_id": row[1],
                "supplier_id": row[2],
                "product": row[3],
                "supplier": row[4],
                "quantity": row[5],
                "origin": row[6],
                "destination": row[7],
                "status": row[8]
            })

        return shipments

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch shipments"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET ONE SHIPMENT
@app.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(shipment_id: int):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                shipments.id,
                shipments.product_id,
                shipments.supplier_id,
                products.name AS product,
                suppliers.name AS supplier,
                shipments.quantity,
                shipments.origin,
                shipments.destination,
                shipments.status
            FROM shipments
            JOIN products
                ON shipments.product_id = products.id
            JOIN suppliers
                ON shipments.supplier_id = suppliers.id
            WHERE shipments.id = %s;
            """,
            (shipment_id,)
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found"
            )

        return {
            "id": row[0],
            "product_id": row[1],
            "supplier_id": row[2],
            "product": row[3],
            "supplier": row[4],
            "quantity": row[5],
            "origin": row[6],
            "destination": row[7],
            "status": row[8]
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch shipment"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# CREATE SHIPMENT
@app.post("/shipments", status_code=201)
def create_shipment(shipment: Shipment, current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check product
        cursor.execute(
            """
            SELECT id
            FROM products
            WHERE id = %s;
            """,
            (shipment.product_id,)
        )

        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="Product doesn't exist"
            )

        # Check supplier
        cursor.execute(
            """
            SELECT id
            FROM suppliers
            WHERE id = %s;
            """,
            (shipment.supplier_id,)
        )

        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="Supplier doesn't exist"
            )

        # Insert shipment
        cursor.execute(
            """
            INSERT INTO shipments
            (
                product_id,
                supplier_id,
                quantity,
                origin,
                destination,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (
                shipment.product_id,
                shipment.supplier_id,
                shipment.quantity,
                shipment.origin,
                shipment.destination,
                shipment.status
            )
        )

        new_shipment = cursor.fetchone()

        conn.commit()

        return new_shipment

    except HTTPException:
        raise

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to add shipment"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# UPDATE SHIPMENT
@app.put("/shipments/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: int,
    shipment: Shipment,
    current_user: dict = Depends(require_admin_or_supplier)
):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check shipment ownership for supplier
        if current_user["role"] == "supplier":

            cursor.execute(
                """
                SELECT supplier_id
                FROM shipments
                WHERE id = %s;
                """,
                (shipment_id,)
            )

            existing_shipment = cursor.fetchone()

            if existing_shipment is None:
                raise HTTPException(
                    status_code=404,
                    detail="Shipment not found"
                )

            if existing_shipment[0] != current_user["supplier_id"]:
                raise HTTPException(
                    status_code=403,
                    detail="You can only edit your own shipments"
                )

        # Check product
        cursor.execute(
            """
            SELECT id
            FROM products
            WHERE id = %s;
            """,
            (shipment.product_id,)
        )

        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="Product doesn't exist"
            )

        # Check supplier
        cursor.execute(
            """
            SELECT id
            FROM suppliers
            WHERE id = %s;
            """,
            (shipment.supplier_id,)
        )

        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="Supplier doesn't exist"
            )

        # Update shipment
        if current_user["role"] == "supplier":

            # Supplier can update ONLY status
            cursor.execute(
                """
                UPDATE shipments
                SET status = %s
                WHERE id = %s
                RETURNING id;
                """,
                (
                    shipment.status,
                    shipment_id
                )
            )

        else:

            # Admin can update all shipment fields
            cursor.execute(
                """
                UPDATE shipments
                SET
                    product_id = %s,
                    supplier_id = %s,
                    quantity = %s,
                    origin = %s,
                    destination = %s,
                    status = %s
                WHERE id = %s
                RETURNING id;
                """,
                (
                    shipment.product_id,
                    shipment.supplier_id,
                    shipment.quantity,
                    shipment.origin,
                    shipment.destination,
                    shipment.status,
                    shipment_id
                )
            )

        updated = cursor.fetchone()

        if updated is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found"
            )

        conn.commit()

        # Get updated shipment
        cursor.execute(
            """
            SELECT
                shipments.id,
                shipments.product_id,
                shipments.supplier_id,
                products.name AS product,
                suppliers.name AS supplier,
                shipments.quantity,
                shipments.origin,
                shipments.destination,
                shipments.status
            FROM shipments
            JOIN products
                ON shipments.product_id = products.id
            JOIN suppliers
                ON shipments.supplier_id = suppliers.id
            WHERE shipments.id = %s;
            """,
            (shipment_id,)
        )

        row = cursor.fetchone()

        return {
            "id": row[0],
            "product_id": row[1],
            "supplier_id": row[2],
            "product": row[3],
            "supplier": row[4],
            "quantity": row[5],
            "origin": row[6],
            "destination": row[7],
            "status": row[8]
        }

    except HTTPException:
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()
# DELETE SHIPMENT
@app.delete("/shipments/{shipment_id}")
def delete_shipment(shipment_id: int, current_user: dict = Depends(require_admin)):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM shipments
            WHERE id = %s
            RETURNING id;
            """,
            (shipment_id,)
        )

        deleted_shipment = cursor.fetchone()

        if deleted_shipment is None:
            raise HTTPException(
                status_code=404,
                detail="Shipment not found"
            )

        conn.commit()

        return {
            "message": "Shipment deleted successfully",
            "id": deleted_shipment[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete shipment"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()# =========================================================
# PRODUCTS
# =========================================================

# CREATE PRODUCT
@app.post(
    "/products",
    status_code=201,
    response_model=ProductResponse
)
def create_product(product: Product, current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO products(name)
            VALUES (%s)
            RETURNING id, name;
            """,
            (product.name,)
        )

        new_product = cursor.fetchone()

        conn.commit()

        return {
            "id": new_product[0],
            "name": new_product[1]
        }

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to add product"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET ALL PRODUCTS
@app.get(
    "/products",
    response_model=list[ProductResponse]
)
def get_products():

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, name
            FROM products;
            """
        )

        rows = cursor.fetchall()

        products = []

        for row in rows:
            products.append({
                "id": row[0],
                "name": row[1]
            })

        return products

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch products"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET PRODUCT BY ID
@app.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
def get_product_by_id(product_id: int):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, name
            FROM products
            WHERE id = %s;
            """,
            (product_id,)
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "id": row[0],
            "name": row[1]
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch product"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# UPDATE PRODUCT
@app.put(
    "/products/{product_id}",
    response_model=ProductResponse
)
def update_product(product_id: int, product: Product, current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE products
            SET name = %s
            WHERE id = %s
            RETURNING id, name;
            """,
            (product.name, product_id)
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        conn.commit()

        return {
            "id": row[0],
            "name": row[1]
        }

    except HTTPException:
        raise

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update product"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# DELETE PRODUCT
@app.delete(
    "/products/{product_id}",
    response_model=ProductResponse
)
def delete_product(product_id: int, current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM products
            WHERE id = %s
            RETURNING id, name;
            """,
            (product_id,)
        )

        deleted_product = cursor.fetchone()

        if deleted_product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        conn.commit()

        return {
            "id": deleted_product[0],
            "name": deleted_product[1]
        }

    except HTTPException:
        raise

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete product"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================================================
# SUPPLIERS
# =========================================================

# CREATE SUPPLIER
@app.post(
    "/suppliers",
    status_code=201,
    response_model=SupplierResponse
)
def create_supplier(supplier: Supplier, current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None
    if current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )
    if get_current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO suppliers(name, country)
            VALUES (%s, %s)
            RETURNING id, name, country;
            """,
            (supplier.name, supplier.country)
        )

        new_supplier = cursor.fetchone()

        conn.commit()

        return {
            
            "id": new_supplier[0],
            "name": new_supplier[1],
            "country": new_supplier[2]
        }

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to add supplier"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET ALL SUPPLIERS
@app.get(
    "/suppliers",
    response_model=list[SupplierResponse]
)
def all_suppliers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, name, country
            FROM suppliers;
            """
        )

        rows = cursor.fetchall()

        suppliers = []

        for row in rows:
            suppliers.append({
                "id": row[0],
                "name": row[1],
                "country": row[2]
            })

        return suppliers

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch suppliers"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET SUPPLIER BY ID
@app.get(
    "/suppliers/{supplier_id}",
    response_model=SupplierResponse
)
def one_supplier(supplier_id: int, current_user: dict = Depends(get_current_user)):


    if current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, name, country
            FROM suppliers
            WHERE id = %s;
            """,
            (supplier_id,)
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

        return {
            "id": row[0],
            "name": row[1],
            "country": row[2]
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch supplier"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# UPDATE SUPPLIER
@app.put(
    "/suppliers/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: int,
    supplier: Supplier,
    current_user:  dict = Depends(require_admin)
):

    conn = None
    cursor = None
    if current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE suppliers
            SET
                name = %s,
                country = %s
            WHERE id = %s
            RETURNING id, name, country;
            """,
            (
                supplier.name,
                supplier.country,
                supplier_id
            )
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

        conn.commit()

        return {
            "id": row[0],
            "name": row[1],
            "country": row[2]
        }

    except HTTPException:
        raise

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update supplier"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# DELETE SUPPLIER
@app.delete(
    "/suppliers/{supplier_id}",
    response_model=SupplierResponse
)
def delete_supplier(supplier_id: int,
                    current_user: dict = Depends(require_admin)):

    conn = None
    cursor = None
    if current_user["role"] == "supplier":
        raise HTTPException(
            status_code=403,
            detail= "Suppliers can not view suppliers"
        )

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM suppliers
            WHERE id = %s
            RETURNING id, name, country;
            """,
            (supplier_id,)
        )

        row = cursor.fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

        conn.commit()

        return {
            "id": row[0],
            "name": row[1],
            "country": row[2]
        }

    except HTTPException:
        raise

    except Exception:
        if conn:
            conn.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete supplier"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()
            
# users:          
@app.post("/users")
def create_user(user: UserCreate,current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    

    password_hash = pwd_context.hash(user.password)

    try:
        cursor.execute(
            """
            INSERT INTO users (username, password_hash, role, supplier_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, role, supplier_id
            """,
            (user.username, password_hash, user.role, user.supplier_id)
        )

        new_user = cursor.fetchone()
        conn.commit()

        return {
            "id": new_user[0],
            "username": new_user[1],
            "role": new_user[2],
            "supplier_id": new_user[3]
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()
        
@app.get("/users")
def get_users(current_user: dict = Depends(require_admin)):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                users.id,
                users.username,
                users.role,
                users.supplier_id,
                suppliers.name
            FROM users
            LEFT JOIN suppliers
                ON users.supplier_id = suppliers.id
            ORDER BY users.id;
            """
        )

        rows = cursor.fetchall()

        users = []

        for row in rows:
            users.append({
                "id": row[0],
                "username": row[1],
                "role": row[2],
                "supplier_id": row[3],
                "supplier": row[4]
            })

        return users

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch users"
        )

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

#login 
@app.post("/login")
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, username, password_hash, role, supplier_id
            FROM users
            WHERE username = %s
            """,
            (user.username,)
        )

        db_user = cursor.fetchone()

        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )

        password_valid = pwd_context.verify(
            user.password,
            db_user[2]
        )

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )

        payload = {
            
            "user_id": db_user[0],
            "username": db_user[1],
            "role": db_user[3],
            "supplier_id": db_user[4]
        }
        token = jwt.encode(
            payload,
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        return {
            "message": "Login Sucessful",
            "access_token": token,
            "token_type":"bearer"   
        }

    except HTTPException:
        raise

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

    finally:
        cursor.close()
        conn.close()    
    

