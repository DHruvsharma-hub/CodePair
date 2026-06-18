import { NextResponse } from "next/server";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface Problem {
  title: string;
  difficulty: string;
  description: string;
  constraints: string;
  examples: Example[];
}

const STATIC_PROBLEMS: Record<string, Problem> = {
  "two-sum": {
    title: "1. Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    constraints: "• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      }
    ]
  },
  "binary-tree-maximum-path-sum": {
    title: "124. Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\n\nThe path sum of a path is the sum of the node's values in the path.\n\nGiven the root of a binary tree, return the maximum path sum of any non-empty path.",
    constraints: "• The number of nodes in the tree is in the range [1, 3 * 10^4].\n• -1000 <= Node.val <= 1000",
    examples: [
      {
        input: "root = [1,2,3]",
        output: "6",
        explanation: "The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6."
      },
      {
        input: "root = [-10,9,20,null,null,15,7]",
        output: "42",
        explanation: "The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42."
      }
    ]
  },
  "lru-cache": {
    title: "146. LRU Cache",
    difficulty: "Medium",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n• `LRUCache(int capacity)` Initialize the LRU cache with positive size `capacity`.\n• `int get(int key)` Return the value of the `key` if the key exists, otherwise return `-1`.\n• `void put(int key, int value)` Update the value of the `key` if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.",
    constraints: "• 1 <= capacity <= 3000\n• 0 <= key <= 10^4\n• 0 <= value <= 10^5\n• At most 2 * 10^5 calls will be made to get and put.",
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: "LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // returns 1"
      }
    ]
  }
};

export async function POST(request: Request) {
  try {
    const { url, rawText } = await request.json();

    // If user inputs raw text, return it directly formatted
    if (rawText && !url) {
      return NextResponse.json({
        title: "Custom Pasted Problem",
        difficulty: "Medium",
        description: rawText,
        constraints: "Not specified.",
        examples: []
      });
    }

    if (!url) {
      return NextResponse.json(
        { error: "A URL or raw text is required" },
        { status: 400 }
      );
    }

    // Try to parse slug from URL
    // e.g. leetcode.com/problems/two-sum/ -> two-sum
    let slug = "";
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      if (pathname.includes("/problems/")) {
        const parts = pathname.split("/problems/");
        if (parts[1]) {
          slug = parts[1].split("/")[0] || "";
        }
      } else {
        // Fallback for general paths
        const segments = pathname.split("/").filter(Boolean);
        slug = segments[segments.length - 1] || "";
      }
    } catch (e) {
      // If URL parsing fails, extract words using regex
      const match = url.match(/\/problems\/([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        slug = match[1];
      }
    }

    slug = slug.toLowerCase().trim();

    if (STATIC_PROBLEMS[slug]) {
      return NextResponse.json(STATIC_PROBLEMS[slug]);
    }

    // Dynamic Mock Scraper Fallback
    // Make a beautiful title from the slug
    const displayTitle = slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const difficulties = ["Easy", "Medium", "Hard"];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)] || "Medium";

    return NextResponse.json({
      title: displayTitle || "Problem Details",
      difficulty: randomDifficulty,
      description: `Description for **${displayTitle}**:\n\nWrite an efficient algorithm to solve the ${displayTitle} problem.\n\n*Note: This problem description was dynamically generated based on the pasted URL. Please check with your partner on optimal approaches.*`,
      constraints: "• 1 <= input.length <= 10^5\n• Time Complexity: O(N) or O(N log N) expected.\n• Space Complexity: O(N) optimal.",
      examples: [
        {
          input: "Standard inputs from URL context",
          output: "Expected outputs matching problem parameters"
        }
      ]
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse problem URL" },
      { status: 500 }
    );
  }
}
