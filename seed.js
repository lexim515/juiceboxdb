const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
} = require("./index");

const testDB = async () => {
  try {
    console.log("Starting to test database...");
    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("getAllUsers:", users);
    console.log("Calling updateUsers on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);
    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);
    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New title",
      content: "Updated content",
    });
    console.log("Result:", updatePostResult);
    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);
    console.log("Finished database tests");
  } catch (error) {
    console.error("Error testing database");
    throw error;
  }
};

const dropTables = async () => {
  try {
    console.log("Starting to drop tables...");
    await client.query(`DROP TABLE IF EXISTS posts`);
    await client.query(`DROP TABLE IF EXISTS users`);
    console.log("Finished dropping tables");
  } catch (error) {
    console.error("Error dropping tables");
    throw error;
  }
};

const createTables = async () => {
  try {
    console.log("Starting to build tables...");
    await client.query(`CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        location varchar(255) NOT NULL,
        active BOOLEAN DEFAULT true
    )`);
    await client.query(`CREATE TABLE posts(
        id SERIAL PRIMARY KEY,  
        "authorId" INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content text NOT NULL, 
        active BOOLEAN DEFAULT true
    );`);
    console.log("Finished building tables");
  } catch (error) {
    console.error("Error building tables");
    throw error;
  }
};

const createInitialPosts = async () => {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    await createPost({
      authorId: albert.id,
      title: "First post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
    });

    await createPost({
      authorId: sandra.id,
      title: "This is me writing",
      content: "Hi my name is Sandra",
    });
    await createPost({
      authorId: glamgal.id,
      title: "Hello world",
      content: "Hi my name is Glamgal",
    });
  } catch (error) {
    throw error;
  }
};

const rebuildDB = async () => {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUser();
    await createInitialPosts();
  } catch (error) {
    console.error(error);
  }
};

const createInitialUser = async () => {
  try {
    console.log("Starting to create users...");
    const albert = await createUser({
      username: "albert",
      password: "bertie99",
      name: "albert",
      location: "here",
    });
    const sandra = await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "sandra",
      location: "there",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "soglam",
      name: "glamgal",
      location: "Hollywood",
    });
    console.log(albert);
    console.log("Finished creating user");
  } catch (error) {
    console.error("Error creating user");
    throw error;
  }
};

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
