import React, { useState, useEffect } from "react";
import { FaArrowAltCircleUp } from "react-icons/fa";
import { VscIssues } from "react-icons/vsc";
import { AiOutlineStar } from "react-icons/ai";
import { BiGitPullRequest } from "react-icons/bi";
import { RiCheckboxCircleFill } from "react-icons/ri";
import hotIcon from "../assets/hotIcon.png";
import { User } from "@supabase/supabase-js";
import { capturePostHogAnayltics } from "../lib/analytics";
import { updateVotesByRepo } from "../lib/supabase";
import useSupabaseAuth from "../hooks/useSupabaseAuth";
import { fetchRecommendations } from "../lib/supabase";
import Avatar from "./Avatar";
import humanizeNumber from "../lib/humanizeNumber";
import { getAvatarLink } from "../lib/github";

export declare interface HotReposProps {
  user: User | null;
}

const HotRepositories = ({ user }: HotReposProps): JSX.Element => {
  const {
    user_metadata: { sub: user_id },
  } = user || { user_metadata: { sub: null } };
  const [hotRepos, setHotRepos] = useState<DbRecomendation[]>([]);
  const [votedReposIds, setVotedReposIds] = useState<number[]>([]);

  const { signIn } = useSupabaseAuth();

  // * This function is just a placeholder to help change the color and state of the selected button on the card.
  const handleVoted = (repo_id: number) => {
    const hasVoted = checkVoted(repo_id);
    if (hasVoted) {
      setVotedReposIds(votedReposIds.filter((id) => id !== repo_id));
    } else {
      setVotedReposIds([...votedReposIds, repo_id]);
    }
  };

  const checkVoted = (repo_id: number) => votedReposIds.includes(repo_id);

  useEffect(() => {
    const hotRepos: DbRecomendation[] = [];

    [
      'oven-sh/bun',
      'pocketbase/pocketbase',
      'open-sauced/open-sauced'
    ].forEach((repo) => fetchRecommendations('popular', 1, user, repo)
      .then((data) => {
        hotRepos.push(...data);
      }));

    setHotRepos(hotRepos);

    fetchRecommendations("myVotes", 1000, user, "").then((data) => {
      setVotedReposIds(data.map((repo) => repo.id));
    });
  }, []);

  async function handleVoteUpdateByRepo(votes: number, repo_id: number) {
    user_id && capturePostHogAnayltics("User voted", "voteClick", "true");

    await updateVotesByRepo(votes, repo_id, user_id);
    handleVoted(repo_id);
  }

  return (
    <div className="flex flex-col px-4 max-w-screen-xl mx-auto">
      <div className="flex space-x-3 items-center">
        <img src={hotIcon} alt="Hot Repo Icon" className="h-5 w-5" />
        <h1 className="text-white font-bold text-2xl">Hot Repositories</h1>
      </div>
      <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full my-5">
        {hotRepos.map(
          ({ id, full_name, name, description, issues, stars, contributions }) => (
            <div key={id} className="p-4 border rounded-lg bg-white w-full space-y-1 relative">
              {/* header & upvote button */}
              <div className="flex justify-between w-full">
                <div className="flex space-x-1 items-center">
                  <img src={getAvatarLink(full_name.replace(`/${name}`, ''))} alt="Hot Repo Icon" className="h-4 w-4 rounded-md overflow-hidden" />
                  <span className="text-xs text-gray-400">{full_name.replace(`/${name}`, '')}</span>
                </div>
                <button
                  className={`px-2 py-0.5 border rounded-lg flex justify-center items-center space-x-1 text-xs transition-all duration-200 ${
                    checkVoted(id) ? "text-saucyRed border-saucyRed " : "text-grey border-gray-500 "
                  }`}
                  onClick={() => (user_id ? handleVoteUpdateByRepo(0, id) : signIn({ provider: "github" }))}
                >
                  <span className="">{checkVoted(id) ? "voted" : "upvote"}</span>
                  {checkVoted(id) ? <RiCheckboxCircleFill className="" /> : <FaArrowAltCircleUp className="" />}
                </button>
              </div>
              {/* repo name & description */}
              <div className="flex flex-col pb-10">
                <a
                  href={`https://app.opensauced.pizza/repos/${full_name}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xl font-semibold"
                >
                  {name}
                </a>
                <p className="text-gray-500 text-xs w-5/6">{description}</p>
              </div>
              {/* issues || star || PRs || Avatar */}
              <div className="flex items-center justify-between absolute bottom-3 inset-x-0 px-4">
                {/* issues || star || PRs*/}
                <div className="flex space-x-3 text-xs">
                  <div className="flex space-x-1 justify-center items-center">
                    <VscIssues />
                    <span>{humanizeNumber(issues)}</span>
                  </div>

                  <div className="flex space-x-1 justify-center items-center">
                    <AiOutlineStar />
                    <span>{humanizeNumber(stars)}</span>
                  </div>

                  <div className="flex space-x-1 justify-center items-center">
                    <BiGitPullRequest />
                    <span>0</span>
                  </div>
                </div>
                {/* Avatars */}
                <div className="-space-x-2 flex hover:space-x-0 transition-all duration-300 ">
                  {contributions.slice(0, 5).map(({contributor, last_merged_at}) => (
                    <Avatar
                      contributor={contributor}
                      lastPr={last_merged_at}/>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default HotRepositories;
