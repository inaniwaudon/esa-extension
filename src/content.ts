import "./content.css";

let displaysNav = false;

interface Post {
  number: number;
  name: string;
}

const getChromeLocal = (key: string) => {
  return new Promise<Record<string, unknown>>((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result);
    });
  });
};

// カテゴリに属する記事を取得
const getPosts = async (
  teamname: string,
  category: string
): Promise<Post[]> => {
  // chrome.storage を確認
  const storageKey = `posts:${category}`;
  const storageResult = await getChromeLocal(storageKey);
  if (storageKey in storageResult) {
    return storageResult[storageKey] as Post[];
  }

  // エンドポイントに fetch
  const endpoint = new URL(`/v1/teams/${teamname}/posts`, "https://api.esa.io");
  endpoint.searchParams.append("q", `on:${category}`);
  endpoint.searchParams.append("per_page", "100");
  console.log(`fetch: ${endpoint}`);

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_ESA_TOKEN}`,
    },
  });
  const json = (await response.json()) as {
    posts: { number: number; name: string }[];
  };
  if (!("posts" in json)) {
    throw new Error("Posts not found");
  }
  const result = json.posts
    .map((item) => ({
      number: item.number,
      name: item.name,
    }))
    .sort((a, b) => (a.name === b.name ? 0 : a.name > b.name ? 1 : -1));
  await chrome.storage.local.set({ [storageKey]: result });
  return result;
};

const addNav = async () => {
  // /posts/:id を対象にする
  const teamname = location.host.split(".")[0];
  const path = location.pathname;
  if (isNaN(path.split("/").at(-1) as any)) {
    return;
  }

  const content = document.querySelector(".layout-app__content");
  const categoryPathLink = document.querySelectorAll(".category-path__link");
  const categoryPath = [...categoryPathLink]
    .map((link) => link.textContent)
    .join("/");
  const sidebarUl = document.querySelector(".navbar-side__nav");
  if (!content || !categoryPath || !sidebarUl) {
    return;
  }

  // アイコンを追加
  const iconAnchor = (() => {
    const li = document.createElement("li");
    li.className = "navbar-side__item custom-icon";

    const a = document.createElement("a");
    a.className = "navbar-side__link";

    const i = document.createElement("i");
    i.className = "navbar-side__icon custom-icon";

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("public/category.svg");
    img.style.display = "block";

    const span = document.createElement("span");
    span.className = "navbar-side__label";
    span.innerHTML = "CATEGORY";

    sidebarUl.appendChild(li);
    li.appendChild(a);
    a.appendChild(i);
    i.appendChild(img);
    a.appendChild(span);
    return a;
  })();

  const insertedNav = document.createElement("nav");
  insertedNav.className = "inserted-nav";
  const ul = document.createElement("ul");

  content.parentNode!.insertBefore(insertedNav, content);
  insertedNav.appendChild(ul);

  // 記事を取得してリストに追加
  let posts: Post[];
  try {
    posts = await getPosts(teamname, categoryPath);
  } catch (e) {
    alert(e);
    return;
  }

  for (const post of posts) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `/posts/${post.number}`;
    a.innerHTML = post.name;
    ul.appendChild(li);
    li.appendChild(a);
  }

  const refreshLi = document.createElement("li");
  const refreshA = document.createElement("a");
  refreshA.innerHTML = "記事一覧を更新";
  ul.appendChild(refreshLi);
  refreshLi.appendChild(refreshA);

  refreshA.onclick = async () => {
    await chrome.storage.local.remove(`posts:${categoryPath}`);
    location.reload();
  };

  // 開閉処理
  iconAnchor.onmouseover = () => {
    displaysNav = true;
    insertedNav.style.width = "300px";
  };

  insertedNav.onmouseleave = () => {
    if (!displaysNav) {
      return;
    }
    displaysNav = false;
    insertedNav.style.width = "0";
  };

  // スクロール時に追随させる
  window.addEventListener("scroll", () => {
    ul.style.marginTop = `${window.scrollY}px`;
  });
};

addNav();
