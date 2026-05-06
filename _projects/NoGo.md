---
layout: page
title: NoGo
description: '"NoGo" (不围棋) chess program. My first project since I majored in computer science.'
img: assets/img/projects/NoGo/image.jpg
importance: 2
category: Fun
---

My first programming course, *Introduction to Computation (A)*, used NoGo as the final project. Genreally, it negates rules of Go (or Weiqi); you lose when you have to capture a stone (吃子) of the other under Go rules.

In this project, I:
1. Implement MCTS (Monte-Carlo Tree Search) with UCT (Upper Confidence Bound applied to Trees) algorithm. 
2. Considering that the beginning layout was hard to search (since the state space is at its maximum), I "trained an AI" to do it. That said, it cannot be seen as AI in the current view; I exported all available games and counted their beginning choices, with the winning ones +1 and losing ones -1 in score. To some extent, it formed a retrievable knowledge base, and my program bascially just obeyed that in the first 4 steps.
3. I made a simple GUI, powered by EasyX. When users play the game, there also exists a background music.

A lot of trials at that time! I didn't really know how to use an external library (in fact, I didn't even know what a "class" was since it was not yet taught), so all of them were written by myself (like parsing json to get training data). Though the final version was quite buggy and the GUI was naive, it was still a valuable experience for me.

> When I entered PKU school of EECS, everything was fresh yet difficult to me. C pointers were hard, recursion algorithms were hard, long programs were hard. Actually, many students didn't have programming experience either. I clearly remembered that in the first programming lab, the professor just asked us to type several C++ snippets; a classmate said to me that he spent quite a time to match the exact number of spaces. And to upload code on Github, I copy-and-pasted them manually by Github website buttons.
>
> Just three months later, we were required to implement the NoGo program. It was an extremely tough task for me. I couldn't implement MCTS correctly, and the final algorithm was quite weak. My program crashed often, and I didn't manage to find all bugs (yes, my final program would still crash). However, I learnt a lot in this struggling process, and I was really excited when the whole project completed.
>
> However, this project spent me too much time so I barely have time to review *Mathematical Analysis (I)*. Though I got a very high score in all other courses (and even rank top 10 in IC (A)), I only got 60 scores in MA (I) and the non-linear GPA algorithm in PKU made me rank 70% in the first term. That was a painful lesson: a 4-credit 60 score can drag other 21-credit 90+ score to 3.2 GPA. I would have to say, you must carefully manage your time instead of diving into topics you're interested in freely, if you care about your GPA.