import React from "react";
import Head from "next/head";
import styles from "./page.module.css";

const CreateQuestion = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Question</title>
      </Head>
      <h2 className={styles.title}>Create a question</h2>
      <input type="text" placeholder="Add Question Here" className={styles.input} />
      <div className={styles.section}>
        <span>Course & Unit</span>
        <button className={styles.editButton}>✎</button>
      </div>
      <div className={styles.section}>
        <span>Additional Information</span>
        <button className={styles.addButton}>+</button>
      </div>
      <div className={styles.section}>
        <span>Answer Choices</span>
        <button className={styles.addButton}>+</button>
      </div>
      <button className={styles.submitButton}>Submit</button>
    </div>
  );
};

export default CreateQuestion;
