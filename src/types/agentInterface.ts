export interface ApiAgent {
    uuid: string;
    displayName: string;
    description?: string;
    developerName?: string;
    releaseDate?: string;
    displayIcon?: string;
    displayIconSmall?: string;
    bustPortrait?: string;
    fullPortrait?: string;
    fullPortraitV2?: string;
    killfeedPortrait?: string;
    background?: string;
    backgroundGradientColors?: string[];
    isPlayableCharacter: boolean;
    role?: ApiRole;
    abilities: ApiAbility[];
}
  
 export interface ApiAbility {
    slot: string;
    displayName: string;
    description?: string;
    displayIcon?: string;
  }

 export interface ApiRole {
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
  }