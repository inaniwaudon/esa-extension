import "./content.css";
import natsort from "natsort";

let displaysNav = false;

interface Post {
  number: number;
  name: string;
}

const getChromeLocal = (key: string) => {
  return new Promise<unknown>((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
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
  if (storageResult) {
    return storageResult as Post[];
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
  const sortedNames = json.posts.map((item) => item.name).sort(natsort());
  const result = sortedNames.map((name) => {
    const post = json.posts.find((item) => item.name === name);
    return { number: post!.number, name };
  });
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

const getSpoilerSetFromStorage = async (storageKey: string) => {
  const storageResult = await getChromeLocal(storageKey);
  return new Set(storageResult ? (storageResult as string[]) : []);
};

const addSpoiler = async () => {
  const content = document.querySelector(".layout-post__content");
  const articleId = location.pathname.split("/").pop();
  if (!content || !articleId) {
    return;
  }

  const storageKey = `spoiler:${articleId}`;

  // ||中身|| を置換
  const spoilerRegex = /\|\|(.+?)\|\|/g;
  const matches = [...content.innerHTML.matchAll(spoilerRegex)];

  // クリック時の処理
  const onclick = async (e: MouseEvent) => {
    const element = e.currentTarget as HTMLElement;
    console.log(element);

    // 赤くする
    if (e.metaKey || e.ctrlKey) {
      if (!element.textContent) {
        return;
      }
      const isRed = element.classList.contains("red");
      element.classList.toggle("red");

      // ストレージに保存
      const spoilers = await getSpoilerSetFromStorage(storageKey);
      if (isRed) {
        spoilers.delete(element.textContent);
      } else {
        spoilers.add(element.textContent);
      }
      chrome.storage.local.set({ [storageKey]: [...spoilers] });
      return;
    }

    // 表示・非表示の切り替え
    element.classList.toggle("display");
  };

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const before = content.innerHTML.substring(0, match.index);
    const after = content.innerHTML.substring(match.index + match[0].length);
    content.innerHTML =
      before + `<span class="spoiler">${match[1]}</span>` + after;
  }

  const spoilers = content.querySelectorAll(".spoiler");
  for (const spoiler of spoilers) {
    const element = spoiler as HTMLElement;
    element.addEventListener("click", onclick);

    // 赤い場合
    if (element.textContent) {
      const spoilers = await getSpoilerSetFromStorage(storageKey);
      if (spoilers.has(element.textContent)) {
        element.classList.add("red");
      }
    }
  }
};

addNav();
addSpoiler();
