const { Client } = require("pg");

const client = new Client("postgres://localhost:5432/juicebox-dev");

const getAllUsers = async () => {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users;`
  );
  return rows;
};

const createUser = async ({ username, password, name, location }) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `INSERT INTO users(username, password, name, location)
    VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING *;`,
      [username, password, name, location]
    );
    return user;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (id, fields = {}) => {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [user],
    } = await client.query(
      `UPDATE users SET ${setString} WHERE id=${id} RETURNING *;`,
      Object.values(fields)
    );
    return user;
  } catch (error) {
    throw error;
  }
};

const createPost = async ({ authorId, title, content, tags = [] }) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `INSERT INTO posts("authorId", title, content)
          VALUES ($1, $2, $3) RETURNING *;`,
      [authorId, title, content]
    );
    const tagList = await createTags(tags);
    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
};

const updatePost = async (id, fields = {}) => {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  try {
    const result = await client.query(
      `UPDATE posts SET ${setString} WHERE id=${id} RETURNING *;`,
      Object.values(fields)
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  try {
    const { rows: postIds } = await client.query(`SELECT id FROM posts;`);
    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
    return posts;
  } catch (error) {
    throw error;
  }
};

const getPostsByUser = async (userId) => {
  try {
    const { rows: postIds } = await client.query(
      `SELECT id FROM posts WHERE "authorId" = ${userId};`
    );
    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
    return posts;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const response = await client.query(
      `SELECT id, username, name, location, active FROM users WHERE id = $1;`,
      [userId]
    );
    if (response.rows.length === 0) {
      return null;
    }
    const user = response.rows[0];
    const posts = await getPostsByUser(userId);
    user.posts = posts;
    return user;
  } catch (error) {
    throw error;
  }
};

const createTags = async (tagList) => {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");

  console.log(insertValues, selectValues);

  try {
    const response = await client.query(
      `INSERT INTO tags (name) VALUES (${insertValues}) ON CONFLICT (name) DO NOTHING;`
    );
    console.log(response);
    const { rows } = await client.query(
      `SELECT * FROM tags WHERE name IN (${selectValues});`
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

const createPostTag = async (postId, tagId) => {
  try {
    await client.query(
      `
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
};

const addTagsToPost = async (postId, tagList) => {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};
const getPostById = async (postId) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      SELECT *
      FROM posts
      WHERE id = $1;
    `,
      [postId]
    );

    const { rows: tags } = await client.query(
      `
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id = post_tags."tagId"
      WHERE post_tags."postId" = $1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
      SELECT id, username, name, location
      FROM users
      WHERE id = $1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
  getPostById,
  createTags,
  addTagsToPost,
};
