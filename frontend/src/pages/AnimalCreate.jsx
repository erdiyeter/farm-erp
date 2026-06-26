import AnimalCreateForm from "../components/AnimalCreateForm";
import { tAnimal as t } from "../i18n";

function AnimalCreate() {
  return (
    <div>
      <h1>{t("Create Animal")}</h1>
      <AnimalCreateForm />
    </div>
  );
}

export default AnimalCreate;
