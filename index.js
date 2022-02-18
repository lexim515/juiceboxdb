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

const createPost = async ({ authorId, title, content }) => {
  try {
    const { rows } = await client.query(
      `INSERT INTO posts("authorId", title, content)
          VALUES ($1, $2, $3) RETURNING *;`,
      [authorId, title, content]
    );
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
    const { rows } = await client.query(
      `SELECT id, "authorId", title, content, active FROM posts;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

const getPostsByUser = async (userId) => {
  try {
    const { rows } = await client.query(
      `SELECT * FROM posts WHERE "authorId" = $1;`,
      [userId]
    );
    return rows;
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
};
