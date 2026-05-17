const API =
  CONFIG.API_URL;

const token =
  localStorage.getItem('token');

let currentUser = null;

async function createCategory() {

  const name =
    document
      .getElementById(
        'categoryName'
      ).value;

  const response =
    await fetch(

      `${API}/api/v1/menu/categories/create`,

      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`

        },

        body: JSON.stringify({

          organizationId:
            currentUser.organizationId,

          outletId:
            currentUser.outletId,

          name

        })

      }

    );

  const data =
    await response.json();

  console.log(data);

  loadCategories();
}

async function loadCategories() {

  const response =
    await fetch(

      `${API}/api/v1/menu/categories/list?organizationId=${currentUser.organizationId}&outletId=${currentUser.outletId}`,

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

  const result =
    await response.json();

  const categoriesDiv =
    document.getElementById(
      'categories'
    );

  const categorySelect =
    document.getElementById(
      'categorySelect'
    );

  categoriesDiv.innerHTML = '';

  categorySelect.innerHTML = '';

  result.data.forEach(cat => {

    categoriesDiv.innerHTML += `
      <div class="card">
        ${cat.name}
      </div>
    `;

    categorySelect.innerHTML += `
      <option value="${cat.id}">
        ${cat.name}
      </option>
    `;

  });

}

async function createItem() {

  const name =
    document
      .getElementById(
        'itemName'
      ).value;

  const basePrice =
    Number(

      document
        .getElementById(
          'itemPrice'
        ).value

    );

  const categoryId =
    document
      .getElementById(
        'categorySelect'
      ).value;

  const response =
    await fetch(

      `${API}/api/v1/menu/items/create`,

      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`

        },

        body: JSON.stringify({

          organizationId:
            currentUser.organizationId,

          outletId:
            currentUser.outletId,

          categoryId,
          name,
          basePrice

        })

      }

    );

  const data =
    await response.json();

  console.log(data);

  loadItems();
}

async function loadItems() {

  const response =
    await fetch(

      `${API}/api/v1/menu/items/list?organizationId=${currentUser.organizationId}&outletId=${currentUser.outletId}`,

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

  const result =
    await response.json();

  const itemsDiv =
    document.getElementById(
      'items'
    );

  itemsDiv.innerHTML = '';

  result.data.forEach(item => {

    itemsDiv.innerHTML += `
      <div class="card">
        ${item.name}
        -
        ₹${item.base_price}
      </div>
    `;

  });

}

async function init() {

  currentUser =
    await loadCurrentUser();

  console.log(currentUser);

  loadCategories();
  loadItems();
}

init();