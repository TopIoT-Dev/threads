"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import { number } from "zod";
import Thread from "../models/thread.model";
import User from "../models/user.models";
import { connectToDB } from "../mongoose";

interface Params {
  name: string;
  path: string;
  username: string;
  userId: string;
  bio: string;
  image: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB();
  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );
    if (path === "profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Faild to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    await connectToDB();
    return await User.findOne({ id: userId });
    // .populate({
    //   path:'communities',
    //   model: Comunity
    // })
  } catch (error: any) {
    throw new Error(`Faild to fetch user ... ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    await connectToDB();

    // TODO: Populate community
    const threads = User.findOne({ id: userId })
      .populate({
        path: "threads",
        model: Thread,
        populate: {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id",
          },
        },
      })
      .exec();

    return threads;
  } catch (error: any) {
    throw new Error(`Faild to fetch user ... ${error.message}`);
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Faild to fetch users ... ${error.message}`);
  }
}

export async function getActivity(userId: string) {
  try {
    await connectToDB();

    // Find all threads created by a user
    const userThreads = await Thread.find({ author: userId });

    // Collect all the child thread ids (replies) from the children field
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId },
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error: any) {
    throw new Error(`Faild to fetch activity ... ${error.message}`);
  }
}
