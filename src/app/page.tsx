import { SignIn, SignOut } from "../components/Actions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth";
import Image from "next/image";
import Form from "@/components/Form";
import { prisma } from "@/server/db";
import Delete from "@/components/Delete";
import { type Session } from "next-auth";

async function getPosts() {
  const data = await prisma.posts.findMany({
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
}

async function getPostsByUserId(userId: string | undefined) {
  const data = await prisma.posts.findMany({
    where: {
      authorId: userId,
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
}

export default async function Home() {
  let session: Session | null | undefined;
  let posts;
  let allPosts;

  try {
    const [sessionRes, allPostsRes] = await Promise.allSettled([
      getServerSession(authOptions),
      getPosts(),
    ]);

    if (sessionRes.status === "fulfilled") {
      session = sessionRes.value;
    } else {
      console.error(sessionRes);
    }

    if (allPostsRes.status === "fulfilled" && allPostsRes.value) {
      allPosts = allPostsRes.value;
    } else {
      console.error(allPostsRes);
    }
  } catch (error) {
    console.error(error);
  }

  if (session) {
    try {
      const postsRes = await Promise.allSettled([
        getPostsByUserId(session?.user?.id),
      ]);
      if (postsRes[0].status === "fulfilled" && postsRes[0].value) {
        posts = postsRes[0].value;
      } else {
        console.error(postsRes);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#2d0336] to-[#000000] text-white">
        <div className="container flex flex-col items-center justify-center gap-10 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <span className="text-[hsl(280,100%,70%)]">Post</span> anything you
            want
          </h1>
          <div className="flex flex-col items-center justify-center gap-1">
            {session?.user ? (
              <>
                <Image
                  className="w-14 rounded-full"
                  width={64}
                  height={64}
                  src={session.user.image as string}
                  alt={session.user.name as string}
                />
                <SignOut />
                <Form />
              </>
            ) : (
              <SignIn />
            )}
          </div>
          <div className="flex max-w-md flex-col items-center justify-center gap-5">
            {session?.user
              ? posts?.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-row items-center justify-center gap-2"
                  >
                    <h2 className="text-sm">{post.author?.name}:</h2>
                    <p className="break-all text-sm font-bold">{post.title}</p>
                    {session?.user.email === post.author?.email && (
                      <Delete id={post.id} />
                    )}
                  </div>
                ))
              : allPosts?.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-row items-center justify-center gap-2"
                  >
                    <h2 className="text-sm">{post.author?.name}:</h2>
                    <p className="break-all text-sm font-bold">{post.title}</p>
                  </div>
                ))}
          </div>
        </div>
      </main>
    </>
  );
}
