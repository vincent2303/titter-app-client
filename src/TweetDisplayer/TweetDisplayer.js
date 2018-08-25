import React from 'react'
import './TweetDisplayer.css'
import { Tweet } from 'react-twitter-widgets'


// takes a list of tweetsId, display each tweets

const TweetDisplayer = ({idList}) => (
    <div>
        {idList.map(id=>(
            <Tweet key={id} tweetId={id} />
        ))}
    </div>
)

export default TweetDisplayer