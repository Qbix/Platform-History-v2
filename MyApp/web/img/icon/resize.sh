#! /bin/bash

for i in 70 76 120 144 150 152 180 196 310; do convert -resize "$i"x"$i" icon.png $i.png; done

for i in 36 48 72 96 144 192; do convert -resize "$i"x"$i" icon.png android-icon-"$i"x"$i".png; done